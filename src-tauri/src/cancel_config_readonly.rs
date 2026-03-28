use std::{
    fs,
    path::Path,
    sync::{Arc, Mutex},
};

use lazy_static::lazy_static;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};

use crate::file_log;

// 全局静态变量，用于存储自动取消只读功能的启用状态、文件监听器实例以及当前监听的文件路径
lazy_static! {
    // 标志位：是否启用自动取消只读属性，使用 Arc<Mutex<bool>> 保证线程安全
    static ref IS_ENABLE_AUTO_CANCEL_READONLY: Mutex<Arc<bool>> = Mutex::new(Arc::new(false));
    // 文件监听器实例，推荐使用 notify 库的默认实现
    static ref WATCHER: Mutex<Option<RecommendedWatcher>> = Mutex::new(None);
    // 记录当前正在监听的文件路径，用于判断是否需要重新配置监听
    static ref CURRENT_WATCH_PATH: Mutex<Option<String>> = Mutex::new(None);
}

/// Tauri 命令：获取当前是否启用了自动取消只读属性功能
#[tauri::command]
pub fn get_is_enable_auto_cancel_config_readonly() -> Result<bool, String> {
    let lock = IS_ENABLE_AUTO_CANCEL_READONLY
        .lock()
        .map_err(|e| e.to_string())?;
    // 解包 Arc 并返回布尔值
    Ok(**lock)
}

/// 内部函数：设置自动取消只读属性功能的启用状态
fn set_is_enable_auto_cancel_confel_readonly(value: bool) -> Result<(), String> {
    let mut lock = IS_ENABLE_AUTO_CANCEL_READONLY
        .lock()
        .map_err(|e| e.to_string())?;
    // 原子性地更新共享状态
    *lock = Arc::new(value);
    Ok(())
}

/// Tauri 命令：启用自动取消只读属性功能，并开始监听指定的配置文件
///
/// # 参数
/// * `rbr_install_path`: RBR 游戏的安装根目录路径
#[tauri::command]
pub fn enable_auto_cancel_config_readonly(rbr_install_path: String) -> Result<(), String> {
    // 标记功能为启用状态
    set_is_enable_auto_cancel_confel_readonly(true)?;

    // 构造具体的配置文件路径 (SavedGames/pfMULLIGATAWNY.acm)
    let config_path = get_config_path(rbr_install_path);

    // 启动或更新文件监听
    do_watch(config_path)?;

    Ok(())
}

#[tauri::command]
pub fn disabled_auto_cancel_readonly() -> Result<(), String> {
    set_is_enable_auto_cancel_confel_readonly(false)?;
    Ok(())
}

/// 内部函数：执行文件监听逻辑，如果路径变化则更新监听器
///
/// # 参数
/// * `config_path_str`: 需要监听的目标文件绝对路径
fn do_watch(config_path_str: String) -> Result<(), String> {
    // 检查当前监听路径是否与目标路径一致，决定是否需要更新
    let needs_update = {
        let current_watch_path_guard = CURRENT_WATCH_PATH.lock().map_err(|e| e.to_string())?;
        match current_watch_path_guard.as_ref() {
            Some(current_watch_path) => current_watch_path != &config_path_str,
            None => true, // 之前未设置监听路径，必须初始化
        }
    };

    // 如果路径未变化，无需重复操作
    if !needs_update {
        return Ok(());
    }

    // 获取监听器锁以进行配置更新
    let mut watcher_guard = WATCHER.lock().map_err(|e| e.to_string())?;

    // 如果监听器尚未初始化，先创建实例
    if watcher_guard.is_none() {
        drop(watcher_guard); // 提前释放锁，避免在 create_watcher 内部加锁时产生死锁风险
        create_watcher()?;
        // 重新获取锁以便后续操作
        watcher_guard = WATCHER.lock().map_err(|e| e.to_string())?;
    }

    // 确保此时监听器已存在
    let watcher = watcher_guard
        .as_mut()
        .ok_or("Watcher initialization failed")?;

    // 如果存在旧的监听路径，先取消监听
    {
        let current_watch_path_guard = CURRENT_WATCH_PATH.lock().map_err(|e| e.to_string())?;
        if let Some(current_watch_path) = current_watch_path_guard.as_ref() {
            watcher
                .unwatch(Path::new(&current_watch_path))
                .map_err(|e| e.to_string())?;
        }
    }

    // 添加新的文件监听路径 (非递归模式)
    watcher
        .watch(Path::new(&config_path_str), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    // 更新全局记录中的当前监听路径
    {
        let mut current_watch_path_guard = CURRENT_WATCH_PATH.lock().map_err(|e| e.to_string())?;
        *current_watch_path_guard = Some(config_path_str);
    }

    Ok(())
}

/// 内部函数：创建并初始化文件监听器，注册事件回调
fn create_watcher() -> Result<(), String> {
    let mut watcher_guard = WATCHER.lock().map_err(|e| e.to_string())?;

    // 创建推荐的文件监听器，传入事件处理闭包
    let new_watch =
        notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| match res {
            Ok(event) => {
                // 仅处理文件修改事件，忽略其他类型事件
                if !matches!(event.kind, EventKind::Modify(_)) {
                    return;
                }

                // 线程安全地读取全局启用标志
                // 注意：此处是在回调线程中获取锁，需确保不会造成死锁
                let is_enabled = match IS_ENABLE_AUTO_CANCEL_READONLY.lock() {
                    Ok(guard) => **guard, // 双重解引用：MutexGuard -> Arc<bool> -> bool
                    Err(e) => {
                        file_log::log_error(format!(
                            "获取 IS_ENABLE_AUTO_CANCEL_READONLY 错误：{}",
                            e
                        ));
                        return; // 获取锁失败时跳过本次事件处理
                    }
                };

                // 如果功能未启用，直接返回，不执行后续操作
                if !is_enabled {
                    return;
                }

                // 遍历事件中包含的所有文件路径
                event.paths.iter().for_each(|path| match path.to_str() {
                    Some(path_str) => {
                        // 尝试取消文件的只读属性，记录潜在错误
                        if let Err(e) = cancel_readonly(path_str.to_string()) {
                            file_log::log_error(format!("取消只读属性失败：{}", e));
                        }
                    }
                    None => {} // 忽略无法转换为字符串的路径
                });
            }
            Err(e) => file_log::log_error(format!("监听错误：{}", e)),
        })
        .map_err(|e| e.to_string())?;

    // 将新创建的监听器存入全局静态变量
    *watcher_guard = Some(new_watch);

    Ok(())
}

/// 内部函数：检测并取消指定文件的只读属性
///
/// # 参数
/// * `path`: 目标文件的路径
fn cancel_readonly(path: String) -> Result<(), String> {
    // 获取文件元数据
    let metadata = fs::metadata(path.clone()).map_err(|e| e.to_string())?;
    let mut permissions = metadata.permissions();

    // 如果文件本身不是只读状态，无需操作
    if !permissions.readonly() {
        return Ok(());
    }

    // 设置只读属性为 false
    permissions.set_readonly(false);
    // 应用新的权限设置
    fs::set_permissions(path.clone(), permissions).map_err(|e| e.to_string())?;
    file_log::log_info(format!("已取消文件【{}】的只读权限", path));
    Ok(())
}

#[tauri::command]
pub fn cancel_config_readonly(rbr_install_path: String) -> Result<(), String> {
    let config_path = get_config_path(rbr_install_path);
    cancel_readonly(config_path)?;
    Ok(())
}

fn get_config_path(rbr_install_path: String) -> String {
    return format!("{}/SavedGames/pfMULLIGATAWNY.acm", rbr_install_path);
}

#[tauri::command]
pub fn get_config_readonly(rbr_install_path: String) -> Result<bool, String> {
    let config_path = get_config_path(rbr_install_path);
    let metadata = fs::metadata(config_path.clone()).map_err(|e| e.to_string())?;
    let permissions = metadata.permissions();
    Ok(permissions.readonly())
}
