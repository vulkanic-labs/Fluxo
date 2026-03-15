import browser from "webextension-polyfill";
import { messagingService } from "~services/MessagingService";

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
    console.log("Executing workflow (stub):", workflowData);
    // TODO: Connect WorkflowExecutionService
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
