// desktop/src/components/Sidebar.tsx
import { faBook, faChevronDown, faChevronRight, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import { ModuleInfo, ToolInfo } from "../api";
import logoUrl from "../assets/Nekora.png";

interface SidebarProps {
  version: string;
  modules: ModuleInfo[];
  tools: ToolInfo[];
  selectedModuleId: string;
  selectedToolId: string;
  onSelectTool: (id: string) => void;
  onOpenModules: () => void;
}

export function Sidebar({
  version,
  modules,
  tools,
  selectedModuleId,
  selectedToolId,
  onSelectTool,
  onOpenModules,
}: SidebarProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({ "Text Processing": true, Other: true });
  const categories = useMemo(() => {
    const textTools = tools.filter((t) => t.id.includes("text"));
    const other = tools.filter((t) => !t.id.includes("text"));
    return [
      { name: "Text Processing", tools: textTools },
      { name: "Other", tools: other },
    ].filter((c) => c.tools.length > 0);
  }, [tools]);

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <img alt="Nekora" className="sidebar-logo" src={logoUrl} />
        <div className="sidebar-brand">
          <h1>Nekora</h1>
          <p>Core host {version ? `v${version}` : "v0.1.0"}</p>
        </div>
      </header>

      <div className="sidebar-scroll">
        <section className="module-section">
          <div className="sidebar-section-title with-action">
            <span>Modules</span>
            <button className="icon-btn compact" onClick={onOpenModules} title="Manage modules">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          {modules.map((module) => (
            <div className={`module-card ${module.id === selectedModuleId ? "active-module" : ""}`} key={module.id}>
              <div className="module-card-header">
                <h3>{module.name}</h3>
                <div className="status-dot" />
              </div>
              <p>{module.description}</p>
              <div className="module-tags">
                <span className="tag">{module.source}</span>
                <span className="tag">v{module.version}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="tool-section">
          <div className="sidebar-section-title">Tools</div>
          {categories.map((category) => (
            <div className="tool-category" key={category.name}>
              <div className="tool-category-header" onClick={() => setOpen((prev) => ({ ...prev, [category.name]: !prev[category.name] }))}>
                <FontAwesomeIcon icon={open[category.name] !== false ? faChevronDown : faChevronRight} />
                {category.name}
              </div>
              {open[category.name] !== false && (
                <div className="tool-list">
                  {category.tools.map((tool) => (
                    <div className={`tool-item ${tool.id === selectedToolId ? "active" : ""}`} key={tool.id} onClick={() => onSelectTool(tool.id)}>
                      <div className="tool-item-icon">
                        <FontAwesomeIcon icon={faBook} />
                      </div>
                      <div className="tool-item-info">
                        <div className="tool-item-name">{tool.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
      <div className="sidebar-fixed-footer">
        &copy; 2026 Ziyi LIU</div>
    </aside>
  );
}
