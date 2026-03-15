/**
 * WorkflowEngine — interprets a draw-flow graph and executes each block
 * sequentially in the browser. Runs in the background service worker.
 *
 * Supported block types (same IDs as blocks.ts):
 *  trigger, new-tab, active-tab, close-tab, switch-tab, reload-tab,
 *  go-back, delay, new-window, event-click, get-text, forms, link,
 *  hover-element, element-scroll, press-key, javascript-code,
 *  take-screenshot, export-data, notification, clipboard,
 *  loop-data, conditions, element-exists, webhook,
 *  insert-data, delete-data, wait-connections, execute-workflow,
 *  switch-to, upload-file, handle-dialog, trigger-event, repeat-task
 */

import browser from "webextension-polyfill";

type NodeEdge = { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string };
type FlowNode = { id: string; type?: string; data: Record<string, any> & { label: string } };
type DrawFlow = { nodes: FlowNode[]; edges: NodeEdge[] };

interface ExecutionContext {
  workflowId: string;
  tabId: number | null;
  windowId: number | null;
  variables: Record<string, any>;
  tableData: Record<string, any[]>;
  loopData: Record<string, { index: number; data: any[] }>;
}

interface ExecutionResult {
  success: boolean;
  nextOutput?: string; // handle id: "output", "output-1", "output-2"
  error?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Block executor registry — each block type gets a handler function
// ──────────────────────────────────────────────────────────────────────────────
type BlockExecutor = (
  data: Record<string, any>,
  ctx: ExecutionContext
) => Promise<ExecutionResult>;

const executors: Record<string, BlockExecutor> = {

  trigger: async (_data, _ctx) => ({ success: true, nextOutput: "output" }),

  delay: async (data, _ctx) => {
    const ms = Number(data.time) || 500;
    await sleep(ms);
    return { success: true, nextOutput: "output" };
  },

  "new-tab": async (data, ctx) => {
    const url = resolveValue(data.url, ctx);
    const tab = await browser.tabs.create({ url, active: data.active !== false });
    ctx.tabId = tab.id ?? null;
    ctx.windowId = tab.windowId ?? null;
    if (data.waitTabLoaded && ctx.tabId) {
      await waitForTabLoad(ctx.tabId);
    }
    return { success: true, nextOutput: "output" };
  },

  "active-tab": async (_data, ctx) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    ctx.tabId = tab?.id ?? ctx.tabId;
    return { success: true, nextOutput: "output" };
  },

  "close-tab": async (data, ctx) => {
    const tabId = ctx.tabId;
    if (tabId) await browser.tabs.remove(tabId);
    ctx.tabId = null;
    return { success: true, nextOutput: "output" };
  },

  "reload-tab": async (_data, ctx) => {
    if (ctx.tabId) await browser.tabs.reload(ctx.tabId);
    return { success: true, nextOutput: "output" };
  },

  "go-back": async (_data, ctx) => {
    if (ctx.tabId) await browser.tabs.goBack(ctx.tabId);
    return { success: true, nextOutput: "output" };
  },

  "switch-tab": async (data, ctx) => {
    const url = resolveValue(data.url, ctx);
    const tabs = await browser.tabs.query({});
    const match = tabs.find(t => t.url && matchUrl(t.url, url));
    if (match?.id) {
      await browser.tabs.update(match.id, { active: true });
      ctx.tabId = match.id;
    } else if (data.createIfNoMatch) {
      const tab = await browser.tabs.create({ url });
      ctx.tabId = tab.id ?? null;
    }
    return { success: true, nextOutput: "output" };
  },

  "new-window": async (data, ctx) => {
    const url = resolveValue(data.url, ctx);
    const win = await browser.windows.create({ url, type: data.type || "normal", incognito: data.incognito || false });
    const tab = win.tabs?.[0];
    ctx.tabId = tab?.id ?? null;
    ctx.windowId = win.id ?? null;
    return { success: true, nextOutput: "output" };
  },

  "take-screenshot": async (data, ctx) => {
    const dataUrl = await browser.tabs.captureVisibleTab(
      ctx.windowId ?? undefined,
      { format: (data.ext || "png") as "png" | "jpeg" }
    );
    if (data.saveToComputer !== false) {
      const filename = (resolveValue(data.fileName, ctx) || "screenshot") + "." + (data.ext || "png");
      await browser.downloads.download({ url: dataUrl, filename, conflictAction: "uniquify" });
    }
    return { success: true, nextOutput: "output" };
  },

  "export-data": async (data, ctx) => {
    const name = resolveValue(data.name, ctx) || "export";
    const rows = Object.values(ctx.tableData).flat();
    const type = data.type || "json";
    const content = type === "csv"
      ? jsonToCsv(rows)
      : JSON.stringify(rows, null, 2);
    const blob = new Blob([content], { type: type === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    await browser.downloads.download({ url, filename: `${name}.${type}`, conflictAction: "uniquify" });
    URL.revokeObjectURL(url);
    return { success: true, nextOutput: "output" };
  },

  notification: async (data, ctx) => {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("assets/icon.png"),
      title: resolveValue(data.title, ctx) || "Fluxo",
      message: resolveValue(data.message, ctx) || "",
    });
    return { success: true, nextOutput: "output" };
  },

  webhook: async (data, ctx) => {
    try {
      const url = resolveValue(data.url, ctx);
      const method = data.method || "POST";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const body = ["GET", "HEAD"].includes(method) ? undefined : resolveValue(data.body, ctx);

      const resp = await fetchWithTimeout(url, { method, headers, body }, data.timeout || 10000);
      const text = await resp.text();

      if (data.assignVariable && data.variableName) {
        try { ctx.variables[data.variableName] = JSON.parse(text); }
        catch { ctx.variables[data.variableName] = text; }
      }
      return { success: true, nextOutput: "output-1" }; // output-1 = success
    } catch (err: any) {
      return { success: false, nextOutput: "output-2", error: err.message }; // output-2 = fallback
    }
  },

  "insert-data": async (data, ctx) => {
    const list: Array<{ name: string; value: any; type: string }> = data.dataList || [];
    for (const item of list) {
      if (item.type === "variable") {
        ctx.variables[item.name] = resolveValue(item.value, ctx);
      } else {
        if (!ctx.tableData[item.name]) ctx.tableData[item.name] = [];
        ctx.tableData[item.name].push(resolveValue(item.value, ctx));
      }
    }
    return { success: true, nextOutput: "output" };
  },

  "delete-data": async (data, ctx) => {
    const list: Array<{ name: string; type: string }> = data.deleteList || [];
    for (const item of list) {
      if (item.type === "variable") delete ctx.variables[item.name];
      else delete ctx.tableData[item.name];
    }
    return { success: true, nextOutput: "output" };
  },

  clipboard: async (data, ctx) => {
    // Content script side — send message to tab
    if (!ctx.tabId) return { success: false, error: "No active tab" };
    const result = await browser.tabs.sendMessage(ctx.tabId, {
      action: "clipboard",
      data: { type: data.type || "get", text: resolveValue(data.dataToCopy, ctx) },
    }).catch(() => null);
    if (result && data.assignVariable && data.variableName) {
      ctx.variables[data.variableName] = result;
    }
    return { success: true, nextOutput: "output" };
  },

  "loop-data": async (data, ctx) => {
    const loopId = data.loopId || "loop";
    if (!ctx.loopData[loopId]) {
      let items: any[] = [];
      try { items = JSON.parse(resolveValue(data.loopData, ctx) || "[]"); } catch {}
      ctx.loopData[loopId] = { index: 0, data: items };
    }
    const loop = ctx.loopData[loopId];
    if (loop.index >= loop.data.length || (data.maxLoop > 0 && loop.index >= data.maxLoop)) {
      delete ctx.loopData[loopId];
      return { success: true, nextOutput: "output" };
    }
    if (data.variableName) ctx.variables[data.variableName] = loop.data[loop.index];
    loop.index++;
    return { success: true, nextOutput: "output" };
  },

  // ── Content-script-required blocks ──────────────────────────────────────────
  "event-click": async (data, ctx) => contentScriptBlock("event-click", data, ctx),
  "hover-element": async (data, ctx) => contentScriptBlock("hover-element", data, ctx),
  "get-text": async (data, ctx) => contentScriptBlock("get-text", data, ctx),
  forms: async (data, ctx) => contentScriptBlock("forms", data, ctx),
  link: async (data, ctx) => contentScriptBlock("link", data, ctx),
  "attribute-value": async (data, ctx) => contentScriptBlock("attribute-value", data, ctx),
  "element-scroll": async (data, ctx) => contentScriptBlock("element-scroll", data, ctx),
  "press-key": async (data, ctx) => contentScriptBlock("press-key", data, ctx),
  "javascript-code": async (data, ctx) => contentScriptBlock("javascript-code", data, ctx),
  "trigger-event": async (data, ctx) => contentScriptBlock("trigger-event", data, ctx),
  "upload-file": async (data, ctx) => contentScriptBlock("upload-file", data, ctx),
  "element-exists": async (data, ctx) => {
    const result = await contentScriptBlock("element-exists", data, ctx).catch(() => ({ success: false, nextOutput: "output-2" as string }));
    return result;
  },
  "switch-to": async (data, ctx) => contentScriptBlock("switch-to", data, ctx),
  "handle-dialog": async (data, ctx) => contentScriptBlock("handle-dialog", data, ctx),
};

// ──────────────────────────────────────────────────────────────────────────────
// Main engine export
// ──────────────────────────────────────────────────────────────────────────────
export async function executeWorkflow(
  workflowId: string,
  drawflow: DrawFlow,
  options: { tabId?: number; startNodeId?: string } = {}
): Promise<void> {
  const ctx: ExecutionContext = {
    workflowId,
    tabId: options.tabId ?? null,
    windowId: null,
    variables: {},
    tableData: {},
    loopData: {},
  };

  const nodeMap = new Map(drawflow.nodes.map(n => [n.id, n]));
  const edgeMap = new Map<string, NodeEdge[]>();
  for (const edge of (drawflow.edges || [])) {
    if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
    edgeMap.get(edge.source)!.push(edge);
  }

  // Find start node — use provided startNodeId or find trigger
  let currentNodeId: string | null = options.startNodeId ??
    drawflow.nodes.find(n => n.data.label === "trigger")?.id ?? null;

  if (!currentNodeId) {
    console.warn("[WorkflowEngine] No trigger or start node found");
    return;
  }

  const visited = new Set<string>();
  let steps = 0;
  const MAX_STEPS = 500;

  while (currentNodeId && steps < MAX_STEPS) {
    if (visited.has(currentNodeId)) {
      // Loop detected that wasn't in our loop-data context — stop
      console.warn("[WorkflowEngine] Loop detected at", currentNodeId);
      break;
    }
    visited.add(currentNodeId);
    steps++;

    const node = nodeMap.get(currentNodeId);
    if (!node) {
      console.warn(`[WorkflowEngine] Node ${currentNodeId} not found in map.`);
      break;
    }

    const blockType = node.data.label;
    console.log(`[WorkflowEngine] Step ${steps}: Executing ${blockType} (${node.id})`);

    if (node.data.disableBlock) {
      console.log(`[WorkflowEngine] Node ${node.id} is disabled. Skipping...`);
      const edges = edgeMap.get(currentNodeId) || [];
      currentNodeId = edges[0]?.target ?? null;
      continue;
    }

    const executor = executors[blockType];
    if (!executor) {
      console.warn("[WorkflowEngine] No executor for block type:", blockType);
      const edges = edgeMap.get(currentNodeId) || [];
      currentNodeId = edges[0]?.target ?? null;
      continue;
    }

    let result: ExecutionResult;
    try {
      result = await executor(node.data, ctx);
      console.log(`[WorkflowEngine] Result for ${blockType}:`, result);
    } catch (err: any) {
      console.error(`[WorkflowEngine] Error at block ${blockType} (${currentNodeId}):`, err);
      result = { success: false, error: err.message };
    }

    if (!result.success && !result.nextOutput) break;

    // Find next node via the handle
    const targetHandle = result.nextOutput || "output";
    const edges = edgeMap.get(currentNodeId) || [];
    const nextEdge = edges.find(e => !e.sourceHandle || e.sourceHandle === targetHandle)
      ?? edges[0];
    currentNodeId = nextEdge?.target ?? null;
  }

  console.log(`[WorkflowEngine] Finished workflow ${workflowId} in ${steps} steps`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function contentScriptBlock(blockType: string, data: Record<string, any>, ctx: ExecutionContext): Promise<ExecutionResult> {
  if (!ctx.tabId) {
    // Try to get the current active tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) ctx.tabId = tab.id;
    else return { success: false, error: "No active tab found for content script block" };
  }

  try {
    const result = (await browser.tabs.sendMessage(ctx.tabId, {
      action: "fluxo:block",
      data: { blockType, blockData: data, variables: ctx.variables, tableData: ctx.tableData },
    })) as any;

    // Handle response from content script
    if (result?.variables) Object.assign(ctx.variables, result.variables);
    if (result?.tableData) Object.assign(ctx.tableData, result.tableData);

    const success = result?.success !== false;
    const nextOutput = success ? (result?.nextOutput || "output") : (result?.nextOutput || "output-2");
    return { success, nextOutput };
  } catch (err: any) {
    return { success: false, error: err.message, nextOutput: "output-2" };
  }
}

/** Replace {{variableName}} and {{tableColumn[0]}} references */
function resolveValue(value: any, ctx: ExecutionContext): any {
  if (typeof value !== "string") return value;
  return value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    if (trimmed in ctx.variables) return String(ctx.variables[trimmed]);
    const parts = trimmed.match(/^(.+)\[(\d+)\]$/);
    if (parts && ctx.tableData[parts[1]]) {
      return String(ctx.tableData[parts[1]][parseInt(parts[2])] ?? "");
    }
    return `{{${key}}}`;
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise(resolve => {
    const listener = (tid: number, info: browser.Tabs.OnUpdatedChangeInfoType) => {
      if (tid === tabId && info.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    browser.tabs.onUpdated.addListener(listener);
    setTimeout(resolve, 15000); // safety timeout
  });
}

function matchUrl(tabUrl: string, pattern: string): boolean {
  if (!pattern) return false;
  try {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      return regex.test(tabUrl);
    }
    return tabUrl.includes(pattern);
  } catch { return false; }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function jsonToCsv(rows: any[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const data = rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","));
  return [header, ...data].join("\n");
}
