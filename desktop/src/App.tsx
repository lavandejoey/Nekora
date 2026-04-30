import {
  faCaretRight,
  faCheck,
  faCopy,
  faDownload,
  faFolderOpen,
  faLink,
  faPaste,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

import { ModuleInfo, ToolInfo, ToolRunResponse, api } from "./api";
import logoUrl from "./assets/Nekora.png";

type LoadState = "loading" | "ready" | "error";
type InputOrigin = "text" | "file" | "link";

const MAX_TEXT_LENGTH = 100_000;

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
  const [inputOrigin, setInputOrigin] = useState<InputOrigin>("text");
  const [inputName, setInputName] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [result, setResult] = useState<ToolRunResponse | null>(null);
  const [resultOrigin, setResultOrigin] = useState<InputOrigin>("text");
  const [resultName, setResultName] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    if (inputOrigin !== "text") return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setRunning(true);
    setError("");
    setCopied(false);

    const timeout = window.setTimeout(async () => {
      if (inputText.length > MAX_TEXT_LENGTH) {
        setError(`Text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
        setRunning(false);
        return;
      }
      await runSelectedTool("text", "");
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [inputOrigin, inputText, loadState, selectedTool]);

  async function runSelectedTool(origin: InputOrigin, name: string) {
    if (!selectedTool) return;
    if (inputText.length > MAX_TEXT_LENGTH) {
      setError(`Text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setRunning(true);
    setError("");
    setCopied(false);

    try {
      const response = await api.runTool(selectedTool.id, { text: inputText });
      if (runIdRef.current === runId) {
        setResult(response);
        setResultOrigin(origin);
        setResultName(name);
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
  }

  function updateTypedText(value: string) {
    setInputOrigin("text");
    setInputName("");
    setInputText(limitText(value));
  }

  async function loadTextFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      setError("Only .txt files are supported now.");
      return;
    }

    const text = await file.text();
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`File text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setInputOrigin("file");
    setInputName(file.name);
    setInputText(text);
    setResult(null);
    setError("");
  }

  async function loadTextLink() {
    const url = linkValue.trim();
    if (!url) return;
    if (!url.toLowerCase().endsWith(".txt")) {
      setError("Only direct .txt links are supported now.");
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      setError(`Could not load text link: ${response.status}`);
      return;
    }

    const text = await response.text();
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Linked text is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
      return;
    }

    setInputOrigin("link");
    setInputName(url);
    setInputText(text);
    setResult(null);
    setError("");
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadTextFile(file);
    event.target.value = "";
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void loadTextFile(file);
  }

  async function copyOutput() {
    if (!result) return;
    await navigator.clipboard.writeText(outputClipboardText(result.output));
    setCopied(true);
  }

  function downloadOutput() {
    if (!result || resultOrigin === "text") return;
    const content = outputClipboardText(result.output);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = outputFileName(resultName, selectedTool?.id ?? "output");
    anchor.click();
    URL.revokeObjectURL(url);
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
              <div className="input-frame">
                <textarea
                  id="tool-input"
                  value={inputText}
                  onChange={(event) => updateTypedText(event.target.value)}
                />
                <span>
                  {inputText.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                </span>
              </div>
              <div
                className="source-box"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropFile}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="source-main">
                  <FontAwesomeIcon icon={faFolderOpen} />
                  <div>
                    <strong>{inputName || "Drop .txt here or click to browse"}</strong>
                    <span>
                      {inputOrigin === "text"
                        ? "Files and links wait for manual processing"
                        : "Loaded text waits for manual processing"}
                    </span>
                  </div>
                </div>
                <div className="link-row" onClick={(event) => event.stopPropagation()}>
                  <FontAwesomeIcon icon={faLink} />
                  <input
                    aria-label="Text link"
                    onChange={(event) => setLinkValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void loadTextLink();
                    }}
                    placeholder="https://example.com/file.txt"
                    type="url"
                    value={linkValue}
                  />
                  <button
                    className="link-load-button"
                    aria-label="Load text link"
                    onClick={loadTextLink}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faPaste} />
                  </button>
                </div>
              </div>
              <input
                accept=".txt,text/plain"
                hidden
                onChange={chooseFile}
                ref={fileInputRef}
                type="file"
              />
              {inputOrigin !== "text" ? (
                <button
                  className="process-button"
                  disabled={running || !selectedTool}
                  onClick={() => runSelectedTool(inputOrigin, inputName)}
                  type="button"
                >
                  Process Text
                </button>
              ) : null}
            </div>
          </section>

          <section className="panel output-panel">
            <div className="panel-header">
              <h2>Output</h2>
              <div className="panel-header-actions">
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
                {result && resultOrigin !== "text" ? (
                  <button
                    className="copy-button"
                    aria-label="Download output"
                    title="Download output"
                    onClick={downloadOutput}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                ) : null}
              </div>
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
    "text.count": ["Hello", "#5"],
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
  const labels: Record<string, string> = {
    characters_no_spaces: "Characters no spaces",
    word_or_character_units: "Word / character units",
  };
  return labels[key] ?? key.replace(/_/g, " ");
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

function limitText(value: string) {
  return value.length > MAX_TEXT_LENGTH ? value.slice(0, MAX_TEXT_LENGTH) : value;
}

function outputFileName(sourceName: string, toolId: string) {
  const baseName = sourceName.split(/[\\/]/).pop()?.replace(/\.txt$/i, "") || "nekora-output";
  const suffix = toolId.replace(/\W+/g, "-");
  return `${baseName}.${suffix}.txt`;
}
