use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

struct BackendProcess {
    child: Mutex<Option<Child>>,
}

impl BackendProcess {
    fn spawn() -> std::io::Result<Self> {
        let backend_dir = backend_dir();
        let repo_root = repo_root();
        let python = std::env::var("NEKORA_PYTHON").unwrap_or_else(|_| "python".to_string());
        let python_path = std::env::join_paths([backend_dir.as_path(), repo_root.as_path()])
            .unwrap_or_else(|_| backend_dir.clone().into_os_string());

        let child = Command::new(python)
            .arg("-m")
            .arg("uvicorn")
            .arg("nekora_core.main:app")
            .arg("--host")
            .arg("127.0.0.1")
            .arg("--port")
            .arg("8000")
            .current_dir(backend_dir)
            .env("PYTHONPATH", python_path)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()?;

        Ok(Self {
            child: Mutex::new(Some(child)),
        })
    }
}

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut child) = self.child.lock() {
            if let Some(mut child) = child.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

fn repo_root() -> PathBuf {
    std::env::var("NEKORA_REPO_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
}

fn backend_dir() -> PathBuf {
    std::env::var("NEKORA_BACKEND_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| repo_root().join("backend"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run_combined() {
    let mut builder = tauri::Builder::default();

    match BackendProcess::spawn() {
        Ok(backend) => {
            builder = builder.manage(backend);
        }
        Err(error) => {
            eprintln!("failed to start Nekora backend: {error}");
        }
    }

    run_builder(builder);
}

pub fn run_ui_only() {
    run_builder(tauri::Builder::default());
}

fn run_builder<R: tauri::Runtime>(builder: tauri::Builder<R>) {
    builder
        .run(tauri::generate_context!())
        .expect("error while running Nekora");
}
