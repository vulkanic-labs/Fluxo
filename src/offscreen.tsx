import { useEffect } from "react";
import browser from "webextension-polyfill";
import { messagingService } from "~services/MessagingService";

export default function OffscreenDocument() {
  useEffect(() => {
    const initOffscreen = async () => {
      await messagingService.initialize();
      
      console.log("Fluxo Offscreen Document Initialized");
      
      messagingService.onMessage("workflow:execute", async ({ workflow, options }) => {
        console.log("Executing workflow in offscreen context", workflow, options);
        // Connect to Fluxo Workflow Engine when built out
      });

      messagingService.onMessage("workflow:stop", async (stateId) => {
        console.log("Stopping workflow state:", stateId);
      });
    };

    initOffscreen();
  }, []);

  return (
    <div>
      <iframe src="/sandbox.html" id="sandbox" style={{ display: "none" }} />
    </div>
  );
}
