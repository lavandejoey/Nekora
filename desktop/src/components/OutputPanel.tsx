// desktop/src/components/OutputPanel.tsx
import { faCode, faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import { ToolRunResponse } from "../api";

interface OutputPanelProps {
  result: ToolRunResponse | null;
  executionTimeMs: number | null;
}

function stringifyOutput(output: Record<string, unknown>): string {
  const textCandidate = output.text ?? output.result ?? output.content ?? output.markdown;
  if (typeof textCandidate === "string") return textCandidate;
  return JSON.stringify(output, null, 2);
}

function getFileMeta(output: Record<string, unknown>): { url: string; name: string } | null {
  const url = typeof output.file_url === "string" ? output.file_url : typeof output.url === "string" ? output.url : null;
  if (!url) return null;
  const name = typeof output.file_name === "string" ? output.file_name : "output.file";
  return { url, name };
}

export function OutputPanel({ result, executionTimeMs }: OutputPanelProps) {
  const [codeView, setCodeView] = useState(false);
  const [copied, setCopied] = useState(false);
  const source = useMemo(() => (result ? stringifyOutput(result.output) : ""), [result]);
  const fileMeta = result ? getFileMeta(result.output) : null;
  const output = result?.output ?? {};
  const statsKeys = ["pages", "lines", "words", "characters", "characters_no_spaces", "word_or_character_units"];
  const isStatsOutput = statsKeys.every((key) => typeof output[key] === "number");

  async function onCopy() {
    if (!source) return;
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="right-panel">
      <header className="output-header">
        <h2>Output</h2>
        <div className="tool-actions">
          <button className="icon-btn" onClick={onCopy} disabled={!result} title={copied ? "Copied" : "Copy"}>
            <FontAwesomeIcon icon={faCopy} />
          </button>
          <button className={`icon-btn ${codeView ? "active-icon-btn" : ""}`} onClick={() => setCodeView((v) => !v)} disabled={!result} title="Toggle code view">
            <FontAwesomeIcon icon={faCode} />
          </button>
        </div>
      </header>

      <div className="output-card output-fade-in">
        <div className={`output-result ${codeView ? "code-view" : "rich-view"}`}>
          {result ? (
            codeView ? (
              <pre>{source}</pre>
            ) : fileMeta ? (
              <div className="empty-output">File output is ready. Use download.</div>
            ) : isStatsOutput ? (
              <div className="stats-grid">
                {statsKeys.map((key) => (
                  <div className="stats-cell" key={key}>
                    <div className="stats-label">{key.replace(/_/g, " ")}</div>
                    <div className="stats-value">{String(output[key] ?? 0)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rich-render">
                {source.split("\n").map((line, i) => (
                  <p key={`${line}-${i}`}>{line || "\u00A0"}</p>
                ))}
              </div>
            )
          ) : (
            <div className="empty-output">Run a tool to see the results here.</div>
          )}
        </div>
        {fileMeta && (
          <div className="file-preview-row">
            <span>File output detected</span>
            <a href={fileMeta.url} download={fileMeta.name} className="icon-btn" title="Download">
              <FontAwesomeIcon icon={faDownload} />
            </a>
          </div>
        )}
        {result && (
          <div className="output-metadata">
            <span>{source.length} chars</span>
            <span>{source.split(/\s+/).filter(Boolean).length} words</span>
            <span>{source.split("\n").length} lines</span>
            <span>{executionTimeMs ?? 0}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
