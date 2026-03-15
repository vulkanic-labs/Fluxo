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

    const messageListener = async (message: any, sender: any) => {
      if (message.type === "fluxo-element-selector") {
        console.log("Fluxo: Element Selector requested");
        // TODO: Mount Element Selector UI
        return { success: true };
      }
      
      if (message.action === "fluxo:block") {
        try {
          const res = await handleBlockExecution(message.data);
          return res;
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }
      return undefined;
    };

    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, true);
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return null; // Will return UI overlays here like Element Picker / Command Palette
};

// ──────────────────────────────────────────────────────────────────────────────
// Content Script Block Execution Logic
// ──────────────────────────────────────────────────────────────────────────────

async function handleBlockExecution({ blockType, blockData, variables, tableData }: any) {
  console.log(`[Fluxo] Executing DOM block: ${blockType}`, blockData);

  const resolveValue = (v: string) => {
    if (typeof v !== "string") return v;
    return v.replace(/\{\{(.+?)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      if (variables[trimmed] !== undefined) return String(variables[trimmed]);
      return `{{${key}}}`;
    });
  };

  const getElements = (selector: string, multiple = false) => {
    if (!selector) return [];
    try {
      if (selector.startsWith("xpath:")) {
        const xp = selector.replace("xpath:", "");
        const iter = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        const nodes = [];
        let node = iter.iterateNext();
        while (node) { nodes.push(node as Element); node = iter.iterateNext(); }
        return multiple ? nodes : nodes.slice(0, 1);
      }
      const nodes = document.querySelectorAll(selector);
      return multiple ? Array.from(nodes) : [nodes[0]].filter(Boolean);
    } catch {
      return [];
    }
  };

  switch (blockType) {
    case "event-click": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const el = els[0] as HTMLElement;
      el.click();
      return { success: true };
    }

    case "hover-element": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const el = els[0] as HTMLElement;
      el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      return { success: true };
    }

    case "get-text": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector, blockData.multiple);
      if (!els.length && !blockData.optional) throw new Error("Element not found");
      
      const texts = els.map(e => e.textContent?.trim() || "");
      const result = blockData.multiple ? texts : texts[0] || "";

      const updates: any = {};
      if (blockData.assignVariable && blockData.variableName) {
        updates.variables = { [blockData.variableName]: result };
      }
      if (blockData.saveToTable && blockData.columnName) {
        updates.tableData = { [blockData.columnName]: blockData.multiple ? result : [result] };
      }
      return { success: true, ...updates };
    }

    case "forms": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const el = els[0] as HTMLInputElement;

      if (blockData.getValue) {
        const val = el.value || el.getAttribute("value") || "";
        const updates: any = {};
        if (blockData.variableName) updates.variables = { [blockData.variableName]: val };
        return { success: true, ...updates };
      }

      // Set value
      const val = resolveValue(blockData.value);
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (blockData.submitAfter) {
        el.form?.submit();
      }
      return { success: true };
    }

    case "element-exists": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (els.length > 0) return { success: true, nextOutput: "output-1" };
      return { success: true, nextOutput: "output-2" };
    }

    case "javascript-code": {
      const code = resolveValue(blockData.code);
      let userFunc;
      try {
        userFunc = new Function("variables", "tableData", "resolve", "reject", code);
      } catch (err: any) {
        throw new Error("Syntax error in custom JS: " + err.message);
      }

      return new Promise((resolve, reject) => {
        try {
          // Provide variables and tableData by reference so they can be mutated
          const result = userFunc(variables, tableData, 
            (val: any) => resolve({ success: true, variables, tableData }), 
            (err: any) => reject(new Error(err))
          );
          
          // If the script doesn't call resolve/reject explicitly, resolve immediately
          if (!code.includes("resolve(") && !code.includes("reject(")) {
            resolve({ success: true, variables, tableData });
          }
        } catch (err: any) {
          reject(new Error(err.message));
        }
      });
    }

    case "element-scroll": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      const target = els.length ? els[0] : window;
      target.scrollBy({ top: blockData.scrollY || 0, left: blockData.scrollX || 0, behavior: "smooth" });
      return { success: true };
    }

    default:
      console.warn(`[Fluxo] Block type '${blockType}' not fully implemented in content script yet.`);
      return { success: true };
  }
}

export default FluxoContentScript;
