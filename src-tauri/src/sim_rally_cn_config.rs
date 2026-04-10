#[tauri::command]
pub fn read_sim_rally_cn_config(rbr_install_path: String) -> Result<String, String> {
    let rbr_config_path = get_config_path(rbr_install_path);
    match std::fs::read_to_string(rbr_config_path.clone()) {
        Ok(contents) => Ok(contents),
        Err(error) => Err(format!("read {} error: {}", rbr_config_path, error)),
    }
}

#[tauri::command]
pub fn write_sim_rally_cn_config(rbr_install_path: String, content: String) -> Result<(), String> {
    let rbr_config_path = get_config_path(rbr_install_path);
    match std::fs::write(rbr_config_path.clone(), content) {
        Ok(_) => Ok(()),
        Err(error) => Err(format!("write {} error: {}", rbr_config_path, error)),
    }
}

fn get_config_path(rbr_install_path: String) -> String {
    format!("{}/SimRallyCN.ini", rbr_install_path)
}
