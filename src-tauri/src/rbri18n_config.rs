use fontdb::Database;

#[tauri::command]
pub fn read_rbr_config(rbr_install_path: String) -> Result<String, String> {
    let rbr_config_path = get_config_path(rbr_install_path);
    match std::fs::read_to_string(rbr_config_path.clone()) {
        Ok(contents) => Ok(contents),
        Err(error) => Err(format!("read {} error: {}", rbr_config_path, error)),
    }
}

#[tauri::command]
pub fn write_rbr_config(rbr_install_path: String, content: String) -> Result<(), String> {
    let rbr_config_path = get_config_path(rbr_install_path);
    match std::fs::write(rbr_config_path.clone(), content) {
        Ok(_) => Ok(()),
        Err(error) => Err(format!("write {} error: {}", rbr_config_path, error)),
    }
}

fn get_config_path(rbr_install_path: String) -> String {
    format!("{}/RichardBurnsRally.ini", rbr_install_path)
}

#[tauri::command]
pub fn list_rbri18n_file(rbr_install_path: String) -> Result<Vec<String>, String> {
    let rbri18n_path = format!("{}/RBRi18n", rbr_install_path);
    match std::fs::read_dir(rbri18n_path) {
        Ok(entries) => {
            let mut files = vec![];
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
                            files.push(entry.file_name().to_string_lossy().to_string());
                        }
                    }
                    Err(e) => return Err(e.to_string()),
                }
            }
            Ok(files)
        }
        Err(e) => return Err(e.to_string()),
    }
}

#[tauri::command]
pub fn list_font_family() -> Result<Vec<String>, String> {
    let mut db = Database::new();
    db.load_system_fonts();

    let mut font_families = Vec::new();

    for face in db.faces() {
        if let Some((family_name, _lang)) = face.families.first() {
            let family_str = family_name.clone();
            if !font_families.contains(&family_str) {
                font_families.push(family_str);
            }
        }
    }

    Ok(font_families)
}
