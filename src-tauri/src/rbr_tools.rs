use std::fs;

use serde_json::json;
use windows::core::HSTRING;
use windows::Win32::Storage::FileSystem::{
    GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW, VS_FIXEDFILEINFO,
};

#[tauri::command]
pub async fn validate_rbr_install_path(
    rbr_install_path: String,
) -> Result<serde_json::Value, String> {
    if rbr_install_path.clone().is_empty() {
        return Ok(json!({ "valid": false, "message": "安装目录不能为空" }));
    }
    if !fs::exists(rbr_install_path.clone()).map_err(|e| e.to_string())? {
        return Ok(json!({ "valid": false, "message": "安装目录不存在" }));
    }
    let rbr_exe_path = rbr_install_path.clone() + "/RichardBurnsRally_SSE.exe";
    if !fs::exists(rbr_exe_path.clone()).map_err(|e| e.to_string())? {
        return Ok(
            json!({ "valid": false, "message": format!("安装目录不正确：未找到文件【{}】", rbr_exe_path) }),
        );
    }

    Ok(json!({ "valid": true, "message": "" }))
}

/// 读取 DLL 文件版本信息中的产品版本(major.minor.build.revision)
pub fn get_dll_product_version(dll_path: String) -> Result<String, String> {
    let path = HSTRING::from(dll_path);

    // 1. 获取版本信息数据大小
    let size = unsafe { GetFileVersionInfoSizeW(&path, None) };
    if size == 0 {
        return Err("读取 DLL 版本信息失败，请确认文件已存在".to_string());
    }

    // 2. 读取版本信息数据
    let mut buffer = vec![0u8; size as usize];
    unsafe { GetFileVersionInfoW(&path, None, size, buffer.as_mut_ptr() as *mut _) }
        .map_err(|e| format!("读取 DLL 版本信息失败: {}", e))?;

    // 3. 查询固定版本信息(包含产品版本)
    let mut info_ptr: *mut core::ffi::c_void = std::ptr::null_mut();
    let mut info_len: u32 = 0;
    let sub_block = HSTRING::from("\\");
    let query_result = unsafe {
        VerQueryValueW(
            buffer.as_ptr() as *const _,
            &sub_block,
            &mut info_ptr,
            &mut info_len,
        )
    };
    if query_result.as_bool() && !info_ptr.is_null() {
        let info = unsafe { &*(info_ptr as *const VS_FIXEDFILEINFO) };
        let product_version = format!(
            "{}.{}.{}.{}",
            (info.dwProductVersionMS >> 16) & 0xFFFF,
            info.dwProductVersionMS & 0xFFFF,
            (info.dwProductVersionLS >> 16) & 0xFFFF,
            info.dwProductVersionLS & 0xFFFF
        );
        return Ok(product_version);
    }

    Err("DLL 中未找到产品版本信息".to_string())
}
