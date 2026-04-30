// desktop/src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api, ModuleInfo, ToolInfo, ToolRunResponse } from "./api";
import { AboutModal } from "./components/AboutModal";
import { CommandBar } from "./components/CommandBar";
import { HistoryModal, RunHistoryItem } from "./components/HistoryModal";
import { ModuleModal } from "./components/ModuleModal";
import { OutputPanel } from "./components/OutputPanel";
import { Sidebar } from "./components/Sidebar";
import { ToolWorkspace } from "./components/ToolWorkspace";

type LoadState = "loading" | "ready" | "error";
type InputOrigin = "text" | "file" | "link";
type InputState = { text: string; url: string; files: File[] };

// const DEFAULT_TEXT = "Hello from Nekora.\n你好 Nekora。\nこんにちは、ネコラ。";

export function App() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [version, setVersion] = useState("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("builtin.neko_text");
  const [selectedToolId, setSelectedToolId] = useState("");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState<InputState>({ text: "", url: "", files: [] });
  const [result, setResult] = useState<ToolRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const [health, moduleList, toolList] = await Promise.all([api.health(), api.modules(), api.tools()]);
        setVersion(health.version);
        setModules(moduleList);
        setTools(toolList);
        setSelectedModuleId(moduleList[0]?.id ?? "builtin.neko_text");
        setSelectedToolId(toolList[0]?.id ?? "");
        setLoadState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoadState("error");
      }
    }
    void load();
  }, []);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.module_id.toLowerCase().includes(q));
  }, [search, tools]);

  const selectedTool = useMemo(() => tools.find((tool) => tool.id === selectedToolId), [selectedToolId, tools]);
  const selectedToolMode = useMemo(() => {
    if (!selectedTool) return { allowText: true, allowUrl: true, allowFiles: true, maxFiles: 3 };
    if (selectedTool.id === "text.uppercase" || selectedTool.id === "text.lowercase") {
      return { allowText: true, allowUrl: false, allowFiles: false, maxFiles: 0 };
    }
    if (selectedTool.id === "text.count") {
      return { allowText: true, allowUrl: true, allowFiles: true, maxFiles: 1 };
    }
    return { allowText: true, allowUrl: true, allowFiles: true, maxFiles: 3 };
  }, [selectedTool]);
  const inputOrigin: InputOrigin = input.files.length > 0 ? "file" : input.url.trim() ? "link" : "text";

  useEffect(() => {
    setInput({ text: "", url: "", files: [] });
    setResult(null);
    setExecutionTimeMs(null);
    setError("");
  }, [selectedToolId]);

  async function runSelectedTool() {
    if (!selectedTool) return;
    const runId = ++runIdRef.current;
    const start = performance.now();
    setRunning(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {};
      const isStatLike = selectedTool.id === "text.count";
      if (!isStatLike || input.files.length === 0) {
        payload.text = input.text;
      }
      if (input.url.trim()) payload.url = input.url.trim();
      if (input.files.length > 0) {
        const primaryFile = input.files[0];
        const primaryText = await primaryFile.text();
        payload.files = await Promise.all(
          input.files.map(async (file) => ({
            name: file.name,
            text: await file.text(),
          }))
        );
        payload.file_name = primaryFile.name;
        payload.file_text = primaryText;
        if (!payload.text) payload.text = primaryText;
        if (isStatLike) payload.text = "";
      }
      const response = await api.runTool(selectedTool.id, payload);
      if (runId !== runIdRef.current) return;
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setExecutionTimeMs(elapsed);
      setResult(response);
      setHistory((prev) =>
        [
          {
            id: crypto.randomUUID(),
            toolId: selectedTool.id,
            toolName: selectedTool.name,
            timestamp: Date.now(),
            snippet: String(
              (response.output.text ?? response.output.result ?? JSON.stringify(response.output)).toString()
            ).slice(0, 120),
            input: { ...input },
            output: response,
            executionTimeMs: elapsed,
          },
          ...prev,
        ].slice(0, 40)
      );
    } catch (err) {
      if (runId === runIdRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (runId === runIdRef.current) setRunning(false);
    }
  }

  function onSearchEnter() {
    if (filteredTools[0]) setSelectedToolId(filteredTools[0].id);
  }

  function clearInput() {
    setInput({ text: "", url: "", files: [] });
    setResult(null);
    setExecutionTimeMs(null);
    setError("");
  }

  function restoreHistory(item: RunHistoryItem) {
    setSelectedToolId(item.toolId);
    setInput(item.input);
    setResult(item.output);
    setExecutionTimeMs(item.executionTimeMs);
    setHistoryOpen(false);
  }

  return (
    <main className="app-shell">
      <Sidebar
        version={version}
        modules={modules}
        tools={filteredTools}
        selectedToolId={selectedToolId}
        selectedModuleId={selectedModuleId}
        onSelectTool={setSelectedToolId}
        onOpenModules={() => setModuleOpen(true)}
      />
      <div className="main-content">
        <CommandBar
          search={search}
          onSearchChange={setSearch}
          onSearchEnter={onSearchEnter}
          onOpenAbout={() => setAboutOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          status={loadState === "ready" ? "Ready" : "Loading"}
        />
        <div className="workspace-container">
          <ToolWorkspace
            key={selectedToolId}
            tool={selectedTool}
            input={input}
            inputOrigin={inputOrigin}
            onInputChange={setInput}
            onClear={clearInput}
            onRun={runSelectedTool}
            running={running}
            allowText={selectedToolMode.allowText}
            allowUrl={selectedToolMode.allowUrl}
            allowFiles={selectedToolMode.allowFiles}
            maxFiles={selectedToolMode.maxFiles}
          />
          <OutputPanel result={result} executionTimeMs={executionTimeMs} />
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
      {moduleOpen && (
        <ModuleModal
          modules={modules}
          selectedModuleId={selectedModuleId}
          onClose={() => setModuleOpen(false)}
          onSelect={setSelectedModuleId}
        />
      )}
      {historyOpen && <HistoryModal history={history} onClose={() => setHistoryOpen(false)} onRestore={restoreHistory} />}
      {aboutOpen && <AboutModal version={version} onClose={() => setAboutOpen(false)} />}
    </main>
  );
}