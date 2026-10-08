use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// Helper to sanitize filename and prevent directory traversal
fn get_save_path(app: &tauri::AppHandle, filename: &str) -> Result<PathBuf, String> {
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err("Invalid filename: directory traversal characters not allowed".into());
    }

    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?
        .join("saves");

    if !base_dir.exists() {
        fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create saves dir: {e}"))?;
    }

    Ok(base_dir.join(filename))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Native File I/O: Save game data to a designated save file
#[tauri::command]
fn save_game_file(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    let path = get_save_path(&app, &filename)?;
    fs::write(&path, content).map_err(|e| format!("Failed to write save file: {e}"))?;
    Ok(format!("Successfully saved to {}", path.display()))
}

/// Native File I/O: Load game data from a designated save file
#[tauri::command]
fn load_game_file(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let path = get_save_path(&app, &filename)?;
    if !path.exists() {
        return Err("Save file does not exist".into());
    }
    fs::read_to_string(&path).map_err(|e| format!("Failed to read save file: {e}"))
}

/// Native File I/O: List all available save files
#[tauri::command]
fn list_save_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?
        .join("saves");

    if !base_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&base_dir).map_err(|e| format!("Failed to read directory: {e}"))?;
    let mut files = Vec::new();

    for entry in entries.flatten() {
        if let Ok(file_type) = entry.file_type() {
            if file_type.is_file() {
                if let Some(name) = entry.file_name().to_str() {
                    files.push(name.to_string());
                }
            }
        }
    }

    files.sort();
    Ok(files)
}

/// Native File I/O: Delete a specific save file
#[tauri::command]
fn delete_save_file(app: tauri::AppHandle, filename: String) -> Result<bool, String> {
    let path = get_save_path(&app, &filename)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete save file: {e}"))?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_game_file,
            load_game_file,
            list_save_files,
            delete_save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
