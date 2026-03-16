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
import { logService } from "./LogService";
import { storageService } from "./StorageService";
import templateBlock from "./templating";
import { BLOCK_DEFINITIONS } from "~tabs/dashboard/editor/data/blocks";
import { workflowService } from "./WorkflowService";

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
  repeatedTasks: Record<string, number>;
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

  "execute-workflow": async (data, ctx) => {
    const workflowId = data.workflowId;
    if (!workflowId) return { success: false, error: "Workflow ID is empty" };

    const workflow = await workflowService.getWorkflowById(workflowId);
    if (!workflow) return { success: false, error: "Workflow not found" };

    if (workflowId === ctx.workflowId) return { success: false, error: "Infinite loop detected" };

    // Pass data
    const childVariables = { ...ctx.variables };
    if (data.globalData) {
      try {
        const globalData = typeof data.globalData === 'string' ? JSON.parse(data.globalData) : data.globalData;
        Object.assign(childVariables, globalData);
      } catch {}
    }

    try {
      await executeWorkflow(workflowId, workflow.drawflow, { 
        variables: childVariables,
        tabId: ctx.tabId || undefined 
      });
      return { success: true, nextOutput: "output" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  "workflow-state": async (data, _ctx) => {
    // Placeholder for workflow state management (stop, pause, etc.)
    return { success: true, nextOutput: "output" };
  },

  delay: async (data, _ctx) => {
    const ms = Number(data.time) || 500;
    await sleep(ms);
    return { success: true, nextOutput: "output" };
  },

  "new-tab": async (data, ctx) => {
    const tab = await browser.tabs.create({ 
      url: data.url, 
      active: data.active !== false,
      windowId: ctx.windowId ?? undefined
    });
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
    const url = data.url;
    const tabs = await browser.tabs.query({});
    const match = tabs.find(t => t.url && matchUrl(t.url, url));
    if (match?.id) {
      await browser.tabs.update(match.id, { active: true });
      if (match.windowId) await browser.windows.update(match.windowId, { focused: true });
      ctx.tabId = match.id;
      ctx.windowId = match.windowId;
    } else if (data.createIfNoMatch) {
      const tab = await browser.tabs.create({ url });
      ctx.tabId = tab.id ?? null;
      ctx.windowId = tab.windowId;
    }
    return { success: true, nextOutput: "output" };
  },

  "new-window": async (data, ctx) => {
    const win = await browser.windows.create({ 
      url: data.url, 
      type: data.type || "normal", 
      incognito: data.incognito || false,
      top: data.top ? Number(data.top) : undefined,
      left: data.left ? Number(data.left) : undefined,
      width: data.width ? Number(data.width) : undefined,
      height: data.height ? Number(data.height) : undefined,
      state: data.windowState || "normal"
    });
    const tab = win.tabs?.[0];
    ctx.tabId = tab?.id ?? null;
    ctx.windowId = win.id ?? null;
    return { success: true, nextOutput: "output" };
  },

  "forward-page": async (_data, ctx) => {
    if (ctx.tabId) await browser.tabs.goForward(ctx.tabId);
    return { success: true, nextOutput: "output" };
  },

  "tab-url": async (data, ctx) => {
    if (!ctx.tabId) return { success: false, error: "No active tab" };
    const tab = await browser.tabs.get(ctx.tabId);
    const url = tab.url || "";
    if (data.assignVariable && data.variableName) {
      ctx.variables[data.variableName] = url;
    }
    return { success: true, nextOutput: "output" };
  },

  cookie: async (data, ctx) => {
    const type = data.type || "get";
    const details: any = {
      name: data.name,
      url: data.url || (ctx.tabId ? (await browser.tabs.get(ctx.tabId)).url : ""),
    };

    if (type === "get") {
      const cookie = await browser.cookies.get(details);
      if (data.assignVariable && data.variableName) {
        ctx.variables[data.variableName] = cookie ? cookie.value : null;
      }
    } else if (type === "set") {
      await browser.cookies.set({
        ...details,
        value: data.value,
        domain: data.domain || undefined,
        path: data.path || undefined,
        secure: data.secure || false,
        httpOnly: data.httpOnly || false,
        expirationDate: data.expirationDate ? Number(data.expirationDate) : undefined,
      });
    } else if (type === "delete") {
      await browser.cookies.remove(details);
    }

    return { success: true, nextOutput: "output" };
  },

  "take-screenshot": async (data, ctx) => {
    const dataUrl = await browser.tabs.captureVisibleTab(
      ctx.windowId ?? undefined,
      { format: (data.ext || "png") as "png" | "jpeg" }
    );
    if (data.saveToComputer !== false) {
      const filename = (data.fileName || "screenshot") + "." + (data.ext || "png");
      await browser.downloads.download({ url: dataUrl, filename, conflictAction: "uniquify" });
    }
    return { success: true, nextOutput: "output" };
  },

  "export-data": async (data, ctx) => {
    const name = data.name || "export";
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
    const notificationOptions = {
      type: "basic" as const,
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACvElEQVR4nO2Yv2sUQRTHP7O7e7mYmD9AIn9AENCEYClpAoqFlYWFpYVgoYVNiiCOvSByiSBaWIidYmERUQsL7S0shIhgE60S0SREv9y7vYvFm9u9u927vY9duH0DA8vO7ps3n3nzZt57M6pUqVKlSpUqVaro6nQ6u9M0vSsiH6MoWpVSbtm2veK99yJyV0Tux3H8SkSe9/v9p8vLy6u9Xm89vXfLsqpRFG1Vq9XvRLQfRdGBlPILXfjeX3DOfXHO3atWqw9F5InWukopv0sp97XWV8Y5B6C1vtrv9+81Go2D6On6/f6+iDwwDIPz6L0XkYf1ev2R9/6yc+621vqi1nrN99I7Hcex7L0Xkd/OuRvOuS/OuXtJkrwfHB8A7/1FEXkSRdGW1vrK8HiXUsqMAn7vXfLeuzAMFxeE/yKl/D64fndkPEnI5zO+UfBz773LwzBcXBD+m5RyMv6C6/dExs8S8PmMLxT83DknTNM0I6OnmI/T6eym8D/j6T6O4y3v/cX0+WfD60nAn06ff0vBn0+ffyDiz0fGzwN+Pv0Fv8i6iXkL/p8m5ovAn4+M92XGfUa+UDAz9Lp7InLf9KOf9VhrXSX7OfvRzXpijO+HAnzD/5GIPzN68C/IeH8gwPezC/C97PnXInI/vfc7InI/veY3InI/vfcHInI/vffHIvIone59InIone69InIone4DIvIoOed9InIoceccmRlz7z2AGRkfRM75BfA9Y86G9/4C+JnxZ8Ofvzd68GfDn0+ffy/gz0fGzwN+Pv0lBX8+fc6vE/PnS8L/m/F77Wdm/H9OQp+R7xfMDL3unIh8SGN8SGN8SGN8SGP8/8G318vLyz9ardYeRjG5XC73z7IsTNM0Y5GMMf6x977rnNscvG4Y5xyjWfH28vLy6uD4P3M0GgfG7yZJ8t45dz+9puvZtm0VRdGW1vpsHMevAHzvXfbe98/6Dx6L1N0RkZcAAAAASUVORK5CYII=", // Fluxo placeholder icon
      title: data.title || "Fluxo",
      message: data.message || "",
    };

    try {
      await browser.notifications.create(notificationOptions);
    } catch (err) {
      console.warn("[WorkflowEngine] Notification failed with icon, trying without icon:", err);
      await browser.notifications.create({ ...notificationOptions, iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" });
    }
    return { success: true, nextOutput: "output" };
  },

  webhook: async (data, ctx) => {
    try {
      const url = data.url;
      const method = data.method || "POST";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const body = ["GET", "HEAD"].includes(method) ? undefined : data.body;

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
        ctx.variables[item.name] = item.value;
      } else {
        if (!ctx.tableData[item.name]) ctx.tableData[item.name] = [];
        ctx.tableData[item.name].push(item.value);
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
      data: { type: data.type || "get", text: data.dataToCopy },
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
      try { 
        const rawData = data.loopData;
        items = typeof rawData === 'string' ? JSON.parse(rawData || "[]") : (Array.isArray(rawData) ? rawData : []);
      } catch {}
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
  "action-chain": async (data, ctx) => contentScriptBlock("action-chain", data, ctx),
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

  "repeat-task": async (data, ctx) => {
    const repeat = Number(data.repeatFor) || 0;
    const blockId = data.id || "repeat";
    const currentCount = ctx.repeatedTasks[blockId] || 0;

    if (currentCount >= repeat) {
      delete ctx.repeatedTasks[blockId];
      return { success: true, nextOutput: "output" }; // Main output
    } else {
      ctx.repeatedTasks[blockId] = currentCount + 1;
      return { success: true, nextOutput: "output-2" }; // Loop output
    }
  },

  "while-loop": async (data, ctx) => {
    const isMatch = await testBasicConditions(data.conditions, ctx);
    if (isMatch) return { success: true, nextOutput: "output-2" }; // Loop output
    return { success: true, nextOutput: "output" }; // Fallback/End
  },

  conditions: async (data, ctx) => {
    const conditions = data.conditions || [];
    for (let i = 0; i < conditions.length; i++) {
      const isMatch = await testBasicConditions([conditions[i]], ctx);
      if (isMatch) return { success: true, nextOutput: `output-${i + 1}` };
    }
    return { success: true, nextOutput: "fallback" };
  },

  "slice-variable": async (data, ctx) => {
    const val = ctx.variables[data.variableName];
    if (typeof val === 'string' || Array.isArray(val)) {
      ctx.variables[data.variableName] = val.slice(data.startIndex || 0, data.endIndex);
    }
    return { success: true, nextOutput: "output" };
  },

  "increase-variable": async (data, ctx) => {
    const val = Number(ctx.variables[data.variableName]) || 0;
    ctx.variables[data.variableName] = val + (Number(data.increaseBy) || 1);
    return { success: true, nextOutput: "output" };
  },

  "regex-variable": async (data, ctx) => {
    const val = String(ctx.variables[data.variableName] || "");
    const regex = new RegExp(data.regex, data.flags || "");
    const match = val.match(regex);
    if (data.assignVariable && data.variableNameResult) {
      ctx.variables[data.variableNameResult] = match ? match[0] : "";
    }
    return { success: true, nextOutput: "output" };
  },
};

async function testBasicConditions(conditions: any[], ctx: ExecutionContext): Promise<boolean> {
  if (!conditions || !conditions.length) return false;
  
  const comparisons: Record<string, (a: any, b: any) => boolean> = {
    eq: (a, b) => String(a) === String(b),
    nq: (a, b) => String(a) !== String(b),
    gt: (a, b) => Number(a) > Number(b),
    gte: (a, b) => Number(a) >= Number(b),
    lt: (a, b) => Number(a) < Number(b),
    lte: (a, b) => Number(a) <= Number(b),
    cnt: (a, b) => String(a).includes(String(b)),
    rgx: (a, b) => new RegExp(String(b)).test(String(a)),
  };

  for (const group of conditions) {
    let groupMatch = true;
    const items = group.items || [];
    
    for (const item of items) {
      if (item.category === 'compare') continue; // Not a value item

      const valA = item.data?.value; 
      // In Fluxo, the engine templates the block data BEFORE calling the executor.
      // So variables like {{myVar}} are already resolved in valA.

      const prevItem = items[items.indexOf(item) - 1];
      const operator = prevItem?.type || 'eq';
      const valB = ctx.variables[item.data?.variableName] || item.data?.value;

      const result = comparisons[operator]?.(valA, valB) ?? (valA === valB);
      if (!result) {
        groupMatch = false;
        break;
      }
    }
    if (groupMatch && items.length > 0) return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main engine export
// ──────────────────────────────────────────────────────────────────────────────
export async function executeWorkflow(
  workflowId: string,
  drawflow: DrawFlow,
  options: { tabId?: number; startNodeId?: string; variables?: Record<string, any> } = {}
): Promise<void> {
  const ctx: ExecutionContext = {
    workflowId,
    tabId: options.tabId ?? null,
    windowId: null,
    variables: { 
      ...(await storageService.getAllVariables()),
      ...options.variables 
    },
    tableData: {},
    loopData: {},
    repeatedTasks: {},
  };

  const logId = await logService.startLog(workflowId, drawflow.nodes.find(n => n.data.label === "trigger")?.data.label || "Workflow");

  // Broadcast start
  browser.runtime.sendMessage({ action: "fluxo:execution-started", payload: { workflowId } }).catch(() => {});

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

    // Broadcast current node
    browser.runtime.sendMessage({ 
      action: "fluxo:node-executing", 
      payload: { workflowId, nodeId: currentNodeId } 
    }).catch(() => {});

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
      const blockDef = BLOCK_DEFINITIONS[blockType];
      const templatedNode = await templateBlock({
        block: node,
        refKeys: blockDef?.refDataKeys,
        data: {
          variables: ctx.variables,
          table: ctx.tableData,
          loopData: ctx.loopData,
          workflow: { id: workflowId },
        },
      });

      result = await executor(templatedNode.data, ctx);
      console.log(`[WorkflowEngine] Result for ${blockType}:`, result);

      if (result.success) {
        await logService.addLogData(logId, {
          nodeId: node.id,
          blockType,
          status: 'success',
          timestamp: Date.now(),
          variables: { ...ctx.variables }
        });
      }
    } catch (err: any) {
      console.error(`[WorkflowEngine] Error at block ${blockType} (${currentNodeId}):`, err);
      result = { success: false, error: err.message };
      
      await logService.addLogData(logId, {
        nodeId: node.id,
        blockType,
        status: 'error',
        message: err.message,
        timestamp: Date.now()
      });
    }

    if (!result.success && !result.nextOutput) break;

    // Find next node via the handle
    const targetHandle = result.nextOutput || "output";
    const edges = edgeMap.get(currentNodeId) || [];
    const nextEdge = edges.find(e => !e.sourceHandle || e.sourceHandle === targetHandle)
      ?? edges[0];
    currentNodeId = nextEdge?.target ?? null;
  }

  await logService.finishLog(logId, steps < MAX_STEPS ? 'success' : 'error', steps >= MAX_STEPS ? 'Max steps reached' : undefined);
  
  // Broadcast stop
  browser.runtime.sendMessage({ action: "fluxo:execution-stopped", payload: { workflowId } }).catch(() => {});
  
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
