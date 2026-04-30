// desktop/src/components/UnifiedInputPanel.tsx
import { faCloudArrowUp, faFile, faFileArchive, faFileAudio, faFileCode, faFileCsv, faFileExcel, faFileImage, faFileLines, faFilePdf, faFilePowerpoint, faFileVideo, faFileWord, faLink, faTriangleExclamation, faXmark, } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useMemo, useRef } from "react";

interface UnifiedTextInputProps {
  input: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

interface UnifiedInputPanelInput {
  text: string;
  url: string;
  files: File[];
}

interface UnifiedInputPanelProps {
  input: UnifiedInputPanelInput;
  onChange: (input: UnifiedInputPanelInput) => void;
  allowText?: boolean;
  allowUrl?: boolean;
  allowFiles?: boolean;
  maxFiles?: number;
}

interface UnifiedFileInputProps {
  files: File[];
  url: string;
  allowUrl: boolean;
  allowFiles: boolean;
  maxfile?: number;
  onFilesChange: (files: File[]) => void;
  onUrlChange: (url: string) => void;
}

function getUrlState(url: string): "empty" | "valid" | "invalid" {
  if (!url.trim()) return "empty";

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? "valid" : "invalid";
  } catch {
    return "invalid";
  }
}

function getFileExt(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

function getFileIcon(filename: string): IconDefinition {
  const ext = getFileExt(filename);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) return faFileImage;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return faFileVideo;
  if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) return faFileAudio;
  if (["pdf"].includes(ext)) return faFilePdf;
  if (["doc", "docx"].includes(ext)) return faFileWord;
  if (["xls", "xlsx"].includes(ext)) return faFileExcel;
  if (["ppt", "pptx"].includes(ext)) return faFilePowerpoint;
  if (["csv"].includes(ext)) return faFileCsv;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return faFileArchive;
  if (["txt", "md", "rtf", "log"].includes(ext)) return faFileLines;
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs", "go", "rs", "html", "css", "json", "xml", "yaml", "yml", "sh"].includes(ext)) return faFileCode;

  return faFile;
}

export function UnifiedTextInput({
  input,
  onChange,
  maxLength,
  disabled = false,
}: UnifiedTextInputProps) {
  return (
    <textarea
      value={input}
      maxLength={maxLength}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type or paste text"
    />
  );
}

export function UnifiedFileInput({
  files,
  url,
  allowUrl,
  allowFiles,
  maxfile = 1,
  onFilesChange,
  onUrlChange,
}: UnifiedFileInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlState = useMemo(() => getUrlState(url), [url]);
  const isFull = !allowFiles || files.length >= maxfile;

  const appendFiles = (incomingFiles: FileList | File[]) => {
    if (isFull || !allowFiles) return;

    const remainingSlots = maxfile - files.length;
    const nextFiles = Array.from(incomingFiles).slice(0, remainingSlots);

    if (nextFiles.length === 0) return;

    onFilesChange([...files, ...nextFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className={`file-input-block ${isFull ? "is-full" : ""}`}>
      {!isFull && (
        <div
          className="file-drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            appendFiles(e.dataTransfer.files);
          }}
        >
          {allowFiles && (
            <div className="file-drop-main">
              <FontAwesomeIcon icon={faCloudArrowUp} />
              <span>
                Drop file or{" "}
                <button
                  type="button"
                  className="file-select-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  select
                </button>
              </span>
            </div>
          )}

          {allowUrl && (
            <div className={`url-input-row embedded ${urlState}`}>
              <FontAwesomeIcon icon={urlState === "invalid" ? faTriangleExclamation : faLink} />
              <input
                type="text"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Paste link"
              />
            </div>
          )}

          {allowUrl && urlState === "invalid" && (
            <div className="url-warning">
              Please enter a valid http or https link.
            </div>
          )}

          {allowUrl && urlState === "valid" && (
            <div className="url-success">
              Link detected. Loading or temporary download can be handled here.
            </div>
          )}

          {allowFiles && (
            <input
            ref={fileInputRef}
            type="file"
            multiple={maxfile > 1}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) appendFiles(e.target.files);
              e.target.value = "";
            }}
          />
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="uploaded-file-list">
          {files.map((file, index) => (
            <div className="uploaded-file-row" key={`${file.name}-${file.size}-${index}`}>
              <div className="uploaded-file-info">
                <FontAwesomeIcon icon={getFileIcon(file.name)} />
                <span>{file.name}</span>
              </div>

              <button
                type="button"
                className="uploaded-file-remove"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UnifiedInputPanel({
  input,
  onChange,
  allowText = true,
  allowUrl = true,
  allowFiles = true,
  maxFiles = 3,
}: UnifiedInputPanelProps) {
  const textDisabled = !allowText || input.files.length > 0;
  return (
    <div className="input-panel">
      <UnifiedTextInput
        input={input.text}
        disabled={textDisabled}
        onChange={(text) => onChange({ ...input, text })}
      />

      {(allowFiles || allowUrl) && (
        <UnifiedFileInput
        files={input.files}
        url={input.url}
        allowFiles={allowFiles}
        allowUrl={allowUrl}
        maxfile={maxFiles}
        onFilesChange={(files) => onChange({ ...input, files, text: files.length > 0 ? "" : input.text })}
        onUrlChange={(url) => onChange({ ...input, url })}
      />
      )}
    </div>
  );
}
