// desktop/src/components/ToolWorkspace.tsx
import { faBolt, faEraser, faRotateRight, } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToolInfo } from "../api";
import { UnifiedInputPanel } from "./UnifiedInputPanel";

interface ToolWorkspaceInput {
  text: string;
  url: string;
  files: File[];
}

interface ToolWorkspaceProps {
  tool: ToolInfo | undefined;
  input: ToolWorkspaceInput;
  onInputChange: (input: ToolWorkspaceInput) => void;
  inputOrigin: "text" | "file" | "link";
  onClear: () => void;
  onRun: () => void;
  running: boolean;
  allowText?: boolean;
  allowUrl?: boolean;
  allowFiles?: boolean;
  maxFiles?: number;
}

export function ToolWorkspace({
  tool,
  input,
  onInputChange,
  inputOrigin,
  onClear,
  onRun,
  running,
  allowText = true,
  allowUrl = true,
  allowFiles = true,
  maxFiles = 3,
}: ToolWorkspaceProps) {
  const hasInput =
    (allowText && Boolean(input.text.trim())) ||
    (allowUrl && Boolean(input.url.trim())) ||
    (allowFiles && input.files.length > 0);

  if (!tool) {
    return (
      <div className="centre-workspace">
        <p>Select a tool to start</p>
      </div>
    );
  }

  return (
    <div className="centre-workspace workspace-transition">
      <header className="tool-header">
        <div className="tool-title-group">
          <div className="tool-large-icon">
            <FontAwesomeIcon icon={faBolt} />
          </div>
          <div className="tool-info">
            <h2>{tool.name}</h2>
            <p className="tool-description">{tool.description}</p>
            <div className="transformation-hint">Mode: {inputOrigin}</div>
          </div>
        </div>

        <div className="tool-actions">
          <button className="btn btn-ghost" onClick={onClear}>
            <FontAwesomeIcon icon={faEraser} />
          </button>

          <button
            className="btn btn-primary"
            onClick={onRun}
            disabled={running || !hasInput}
          >
            {running ? (
              <FontAwesomeIcon icon={faRotateRight} className="spinner" />
            ) : (
              <FontAwesomeIcon icon={faBolt} />
            )}
            Run
          </button>
        </div>
      </header>

      <UnifiedInputPanel
        input={input}
        onChange={onInputChange}
        allowText={allowText}
        allowUrl={allowUrl}
        allowFiles={allowFiles}
        maxFiles={maxFiles}
      />
    </div>
  );
}
