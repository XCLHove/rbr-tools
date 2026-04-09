mod cancel_config_readonly;
mod file_log;
mod path_utils;
mod rbr_tools;
mod rbri18n_config;
mod rbri18n_installer;
mod rsf_config;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    file_log::init().expect("Failed to initialize log file");
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            file_log::log_debug,
            file_log::log_info,
            file_log::log_warn,
            file_log::log_error,
            rbri18n_installer::check_rbri18n_install_status,
            rbri18n_installer::install_rbri18n,
            rbr_tools::validate_rbr_install_path,
            cancel_config_readonly::get_config_readonly,
            cancel_config_readonly::cancel_config_readonly,
            cancel_config_readonly::get_is_enable_auto_cancel_config_readonly,
            cancel_config_readonly::enable_auto_cancel_config_readonly,
            cancel_config_readonly::disabled_auto_cancel_readonly,
            rbri18n_config::read_rbr_config,
            rbri18n_config::write_rbr_config,
            rbri18n_config::list_rbri18n_file,
            rbri18n_config::list_font_family,
            rsf_config::write_rsf_config,
            rsf_config::read_rsf_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
