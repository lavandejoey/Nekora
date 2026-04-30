// desktop/src/components/AboutModal.tsx
import { useEffect } from "react";
import { faBookOpen, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faReact } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logoUrl from "../assets/Nekora.png";

interface AboutModalProps {
  version: string;
  onClose: () => void;
  onOpenDocs?: () => void;
}

function TechChip({
  label,
  icon,
  customIcon,
}: {
  label: string;
  icon?: Parameters<typeof FontAwesomeIcon>[0]["icon"];
  customIcon?: React.ReactNode;
}) {
  return (
    <span className="about-tech-chip">
      <span className="about-tech-chip-icon">
        {customIcon ?? (icon ? <FontAwesomeIcon icon={icon} /> : null)}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function AboutModal({
  version,
  onClose,
  onOpenDocs,
}: AboutModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop about-backdrop" onClick={onClose}>
      <div
        className="about-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <button
          type="button"
          className="about-close-btn"
          onClick={onClose}
          aria-label="Close about modal"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="about-logo-wrap">
          <img src={logoUrl} alt="Nekora logo" className="about-logo" />
        </div>

        <div className="about-main">
          <h2 id="about-modal-title" className="about-heading">
            About Nekora
          </h2>

          <p className="about-subheading">
            Local-first modular desktop toolkit
          </p>

          <div className="about-version-pill">
            <span className="about-version-dot" />
            <span>Core host v{version || "0.1.0"}</span>
          </div>

          <div className="about-divider" />

          <p className="about-description">
            Nekora is a local-first, modular desktop toolkit
            <br />
            built with modern web technologies.
          </p>

          <div className="about-tech-row">
            <TechChip
              label="Tauri v2"
              customIcon={<span className="about-chip-glyph">⟡</span>}
            />
            <TechChip label="React" icon={faReact} />
            <TechChip
              label="TypeScript"
              customIcon={<span className="about-chip-ts">TS</span>}
            />
            <TechChip
              label="Vite"
              customIcon={<span className="about-chip-glyph">V</span>}
            />
          </div>

          <div className="about-divider about-divider-bottom" />

          <div className="about-actions">
            <button
              type="button"
              className="about-docs-btn"
              onClick={onOpenDocs}
            >
              <FontAwesomeIcon icon={faBookOpen} />
              <span>Documentation</span>
            </button>

            <button
              type="button"
              className="about-primary-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}