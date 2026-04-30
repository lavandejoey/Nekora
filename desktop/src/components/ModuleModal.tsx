// desktop/src/components/ModuleModal.tsx
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ModuleInfo } from "../api";

interface ModuleModalProps {
  modules: ModuleInfo[];
  selectedModuleId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModuleModal({ modules, selectedModuleId, onSelect, onClose }: ModuleModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Modules</h3>
          <button className="icon-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="module-groups">
          <h4>Installed modules</h4>
          {modules.map((module) => (
            <button
              key={module.id}
              className={`module-modal-card ${module.id === selectedModuleId ? "selected" : ""}`}
              onClick={() => onSelect(module.id)}
            >
              <strong>{module.name}</strong>
              <span>v{module.version}</span>
            </button>
          ))}
          <h4>Available modules</h4>
          <div className="module-modal-card unavailable">No additional modules</div>
        </div>
      </div>
    </div>
  );
}
