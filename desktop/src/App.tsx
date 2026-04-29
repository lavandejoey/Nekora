import { faCaretRight, faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const runIdRef = useRef(0);

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

  useEffect(() => {
    if (!selectedTool || loadState !== "ready") return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setRunning(true);
    setError("");
    setCopied(false);

    const timeout = window.setTimeout(async () => {
      try {
        const response = await api.runTool(selectedTool.id, { text: inputText });
        if (runIdRef.current === runId) {
          setResult(response);
        }
      } catch (err) {
        if (runIdRef.current === runId) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (runIdRef.current === runId) {
          setRunning(false);
        }
      }
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [inputText, loadState, selectedTool]);

  async function copyOutput() {
    if (!result) return;
    await navigator.clipboard.writeText(outputClipboardText(result.output));
    setCopied(true);
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
                  <ToolExample toolId={tool.id} />
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
            </div>
          </section>

          <section className="panel output-panel">
            <div className="panel-header">
              <h2>Output</h2>
              <button
                className="copy-button"
                aria-label="Copy output"
                title="Copy output"
                disabled={!result}
                onClick={copyOutput}
                type="button"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            <OutputView output={result?.output ?? null} running={running} />
          </section>
        </section>
      )}
      <footer className="app-footer">{copyrightText()}</footer>
    </main>
  );
}

function ToolExample({ toolId }: { toolId: string }) {
  const examples: Record<string, [string, string]> = {
    "text.uppercase": ["abc", "ABC"],
    "text.lowercase": ["ABC", "abc"],
    "text.count": ["text", "4"],
  };
  const [before, after] = examples[toolId] ?? ["input", "output"];

  return (
    <small className="tool-example">
      <span>{before}</span>
      <FontAwesomeIcon icon={faCaretRight} />
      <span>{after}</span>
    </small>
  );
}

function OutputView({
  output,
  running,
}: {
  output: Record<string, unknown> | null;
  running: boolean;
}) {
  const content = output ? (
    <div className="output-content">
      {Object.entries(output).map(([key, value]) => (
        <div className="output-row" key={key}>
          <span>{humanizeKey(key)}</span>
          <strong>{formatOutputValue(value)}</strong>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-output">No output yet.</div>
  );

  return (
    <div className="output-frame">
      <div className={running ? "output-blur" : ""}>{content}</div>
      {running ? (
        <div className="output-overlay">
          <div className="sync-spinner" aria-label="Updating" role="status" />
        </div>
      ) : null}
    </div>
  );
}

function humanizeKey(key: string) {
  return key.replace(/_/g, " ");
}

function formatOutputValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function outputClipboardText(output: Record<string, unknown>) {
  if (typeof output.text === "string" && Object.keys(output).length === 1) {
    return output.text;
  }

  return Object.entries(output)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatOutputValue(value)}`)
    .join("\n");
}
