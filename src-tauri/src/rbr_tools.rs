use std::fs;

use serde_json::json;

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
