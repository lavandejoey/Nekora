import { useEffect, useMemo, useState } from "react";

import { ModuleInfo, ToolInfo, ToolRunResponse, api } from "./api";
import logoUrl from "./assets/Nekora.png";

type LoadState = "loading" | "ready" | "error";

function copyrightText() {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearText =
    currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
  return `Copyright © ${yearText} Ziyi LIU`;
}

export function App() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [inputText, setInputText] = useState(
    "Hello from Nekora.\n你好 Nekora。\nこんにちは、ネコラ。",
  );
  const [result, setResult] = useState<ToolRunResponse | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [health, moduleList, toolList] = await Promise.all([
          api.health(),
          api.modules(),
          api.tools(),
        ]);
        setVersion(health.version);
        setModules(moduleList);
        setTools(toolList);
        setSelectedToolId(toolList[0]?.id ?? "");
        setLoadState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoadState("error");
      }
    }

    void load();
  }, []);

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.id === selectedToolId),
    [selectedToolId, tools],
  );

  async function runSelectedTool() {
    if (!selectedTool) return;
    setRunning(true);
    setResult(null);
    setError("");

    try {
      const response = await api.runTool(selectedTool.id, { text: inputText });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img alt="" className="brand-logo" src={logoUrl} />
          <div>
            <h1>Nekora</h1>
            <p>Core host {version ? `v${version}` : ""}</p>
          </div>
        </div>
        <div className={`status status-${loadState}`}>
          <span />
          {loadState}
        </div>
      </header>

      {loadState === "error" ? (
        <section className="notice">
          <h2>Backend unavailable</h2>
          <p>{error}</p>
        </section>
      ) : (
        <section className="workspace">
          <aside className="panel module-panel">
            <div className="panel-header">
              <h2>Modules</h2>
              <span>{modules.length}</span>
            </div>
            <div className="module-list">
              {modules.map((module) => (
                <article className="module-item" key={module.id}>
                  <div>
                    <h3>{module.name}</h3>
                    <p>{module.description}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Source</dt>
                      <dd>{module.source}</dd>
                    </div>
                    <div>
                      <dt>Tools</dt>
                      <dd>{module.tools.length}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </aside>

          <section className="panel tool-panel">
            <div className="panel-header">
              <h2>Tools</h2>
              <span>{tools.length}</span>
            </div>
            <div className="tool-grid">
              {tools.map((tool) => (
                <button
                  className={tool.id === selectedToolId ? "tool active" : "tool"}
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  type="button"
                >
                  <span>{tool.name}</span>
                  <small>{tool.description}</small>
                </button>
              ))}
            </div>

            <div className="runner">
              <label htmlFor="tool-input">Input</label>
              <textarea
                id="tool-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
              />
              <button
                className="run-button"
                disabled={!selectedTool || running}
                onClick={runSelectedTool}
                type="button"
              >
                {running ? "Running" : "Run"}
              </button>
            </div>
          </section>

          <section className="panel output-panel">
            <div className="panel-header">
              <h2>Output</h2>
              <span>{selectedTool?.id ?? "none"}</span>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            <pre>{result ? JSON.stringify(result.output, null, 2) : "{}"}</pre>
          </section>
        </section>
      )}
      <footer className="app-footer">{copyrightText()}</footer>
    </main>
  );
}
