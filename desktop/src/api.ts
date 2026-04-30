// desktop/src/api.ts
export type ModuleInfo = {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  tools: string[];
  source: string;
  enabled: boolean;
};

export type ToolInfo = {
  id: string;
  module_id: string;
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
};

export type ToolRunResponse = {
  tool_id: string;
  module_id: string;
  output: Record<string, unknown>;
};

const API_BASE = import.meta.env.VITE_NEKORA_API_BASE ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; version: string }>("/health"),
  modules: () => request<ModuleInfo[]>("/modules"),
  tools: () => request<ToolInfo[]>("/tools"),
  runTool: (toolId: string, inputData: Record<string, unknown>) =>
    request<ToolRunResponse>(`/tools/${encodeURIComponent(toolId)}/run`, {
      method: "POST",
      body: JSON.stringify({ input_data: inputData }),
    }),
};

