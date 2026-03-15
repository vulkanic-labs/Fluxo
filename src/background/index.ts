import browser from "webextension-polyfill";
import { messagingService } from "~services/MessagingService";
import { workflowService } from "~services/WorkflowService";
import { executeWorkflow } from "~services/WorkflowEngine";

async function initializeBackground() {
  await messagingService.initialize();
  console.log("Fluxo Background Service Worker Initialized");

  // Stub message listeners for workflow execution, fetch, and debugging
  messagingService.onMessage("fetch", async (payload: { type: string, resource: RequestInit & { url: string } }) => {
    try {
      const { type, resource } = payload;
      const response = await fetch(resource.url, resource);
      if (!response.ok) throw new Error(response.statusText);
      return type === "text" ? response.text() : response.json();
    } catch (e) {
      console.error("Fetch error in background:", e);
      throw e;
    }
  });

  messagingService.onMessage("workflow:execute", async (workflowData) => {
    console.log("Executing workflow:", workflowData);
    const { workflowId } = workflowData;
    
    // Ensure workflow list is loaded
    await workflowService.initialize();
    const wf = workflowService.getWorkflowById(workflowId);
    
    if (!wf || !wf.drawflow) {
      console.error("Workflow not found or has no canvas data:", workflowId);
      return;
    }

    try {
      const df = typeof wf.drawflow === "string" ? JSON.parse(wf.drawflow) : wf.drawflow;
      // Fire and forget (it handles its own async execution)
      executeWorkflow(workflowId, df);
    } catch (err) {
      console.error("Error parsing drawflow for execution:", err);
    }
  });

  messagingService.onMessage("workflow:executeFrom", async (data) => {
    console.log("Executing workflow from node:", data);
    const { workflowId, nodeId } = data;
    
    await workflowService.initialize();
    const wf = workflowService.getWorkflowById(workflowId);
    
    if (!wf || !wf.drawflow) return;
    try {
      const df = typeof wf.drawflow === "string" ? JSON.parse(wf.drawflow) : wf.drawflow;
      executeWorkflow(workflowId, df, { startNodeId: nodeId });
    } catch (err) {
      console.error(err);
    }
  });

  messagingService.onMessage("fluxo-element-selector", async (data) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.tabs.sendMessage(tab.id, { type: "fluxo-element-selector" });
    }
  });

  // Action Click Listener (Browser Action Popup is default, this is an override if needed)
  if (browser.action || browser.browserAction) {
    const action = browser.action || browser.browserAction;
    action.onClicked.addListener((tab) => {
      console.log("Action clicked", tab);
    });
  }

  // Handle Alarms
  browser.alarms.onAlarm.addListener((alarm) => {
    console.log("Alarm triggered:", alarm.name);
  });
}

initializeBackground().catch(console.error);
