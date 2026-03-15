import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import cssText from "data-text:~style.css";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { messagingService } from "~services/MessagingService";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

const FluxoContentScript = () => {
  useEffect(() => {
    let contextElement: Element | null = null;
    let textSelection = "";
    
    const handleContextMenu = (e: MouseEvent) => {
      contextElement = e.target as Element;
      textSelection = window.getSelection()?.toString() || "";
    };
    
    window.addEventListener("contextmenu", handleContextMenu, true);

    const messageListener = (message: any) => {
      if (message.type === "fluxo-element-selector") {
        console.log("Fluxo: Element Selector requested");
        // TODO: Mount Element Selector UI
        return true;
      }
      return null;
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, true);
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return null; // Will return UI overlays here like Element Picker / Command Palette
};

export default FluxoContentScript;
