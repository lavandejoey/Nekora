// desktop/src/components/HistoryModal.tsx
import { faClockRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { ToolRunResponse } from "../api";

export interface RunHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: number;
  snippet: string;
  input: { text: string; url: string; files: File[] };
  output: ToolRunResponse;
  executionTimeMs: number;
}

interface HistoryModalProps {
  history: RunHistoryItem[];
  onClose: () => void;
  onRestore: (item: RunHistoryItem) => void;
}

export function HistoryModal({ history, onClose, onRestore }: HistoryModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel history-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>History</h3>
          <button className="icon-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="history-list">
          {history.map((item) => (
            <button key={item.id} className="history-item" onClick={() => onRestore(item)}>
              <div className="history-title">
                <FontAwesomeIcon icon={faClockRotateLeft} />
                <span>{item.toolName}</span>
              </div>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
              <p>{item.snippet}</p>
            </button>
          ))}
          {history.length === 0 && <div className="empty-output">No history yet.</div>}
        </div>
      </div>
    </div>
  );
}
