// desktop/src/components/CommandBar.tsx
import { faClockRotateLeft, faGear, faInfoCircle, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { StatusIndicator } from "./StatusIndicator";

interface CommandBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  onOpenHistory: () => void;
  onOpenAbout: () => void;
  status: "Ready" | "Loading";
}

export function CommandBar({
  search,
  onSearchChange,
  onSearchEnter,
  onOpenHistory,
  onOpenAbout,
  status,
}: CommandBarProps) {
  return (
    <div className="command-bar">
      <div className="search-input-wrapper">
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <input
          className="search-input"
          placeholder="Search tools and modules"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchEnter();
          }}
        />
      </div>
      <div className="command-bar-actions">
        <button className="icon-btn" onClick={onOpenHistory} title="History">
          <FontAwesomeIcon icon={faClockRotateLeft} />
        </button>
        <button className="icon-btn" onClick={onOpenAbout} title="About">
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
        <button className="icon-btn" title="Settings">
          <FontAwesomeIcon icon={faGear} />
        </button>
        <StatusIndicator status={status} />
      </div>
    </div>
  );
}
