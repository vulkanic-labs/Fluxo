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
    const state = {
      contextElement: null as Element | null,
      textSelection: ""
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      state.contextElement = e.target as Element;
      state.textSelection = window.getSelection()?.toString() || "";
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
          const res = await handleBlockExecution(message.data, state);
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

async function handleBlockExecution({ blockType, blockData, variables, tableData }: any, state: { contextElement: Element | null, textSelection: string }) {
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

    case "attribute-value": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const el = els[0];
      const attr = resolveValue(blockData.attributeName);
      
      if (blockData.action === "set") {
        el.setAttribute(attr, resolveValue(blockData.attributeValue));
        return { success: true };
      } else {
        const val = el.getAttribute(attr) || "";
        const updates: any = {};
        if (blockData.variableName) updates.variables = { [blockData.variableName]: val };
        return { success: true, ...updates };
      }
    }

    case "trigger-event": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const eventName = resolveValue(blockData.eventName);
      const event = new Event(eventName, { bubbles: true, cancelable: true });
      els[0].dispatchEvent(event);
      return { success: true };
    }

    case "upload-file": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Element not found");
      const el = els[0] as HTMLInputElement;
      
      // Note: In browser extensions, we can't fully automate file selection due to security
      // unless we use debugger or the user interacts. But we can try setting the files property
      // if we have local file paths (limited in MV3).
      console.warn("Upload file block has limited support in MV3 without debugger.");
      return { success: true };
    }

    case "javascript-code": {
      const code = resolveValue(blockData.code);
      // Construct a script that roughly matches Automa's environment
      const script = `
        (async () => {
          const variables = ${JSON.stringify(variables)};
          const tableData = ${JSON.stringify(tableData)};
          
          function automaNextBlock(data) {
            window.dispatchEvent(new CustomEvent('fluxo:next', { detail: { data, variables, tableData } }));
          }
          function automaSetVariable(name, value) {
            variables[name] = value;
          }
          
          try {
            ${code}
            if (!${code.includes("automaNextBlock")}) automaNextBlock();
          } catch (err) {
            window.dispatchEvent(new CustomEvent('fluxo:error', { detail: err.message }));
          }
        })();
      `;

      return new Promise((resolve, reject) => {
        const onNext = (e: any) => {
          window.removeEventListener('fluxo:next', onNext);
          window.removeEventListener('fluxo:error', onError);
          resolve({ success: true, ...e.detail });
        };
        const onError = (e: any) => {
          window.removeEventListener('fluxo:next', onNext);
          window.removeEventListener('fluxo:error', onError);
          reject(new Error(e.detail));
        };
        window.addEventListener('fluxo:next', onNext);
        window.addEventListener('fluxo:error', onError);

        const s = document.createElement('script');
        s.textContent = script;
        (document.head || document.documentElement).appendChild(s);
        s.remove();
      });
    }

    case "switch-to": {
      // Logic for switching frames is handled by the background engine 
      // targeting different frameIds. Here we just return success if we are the correct frame.
      return { success: true };
    }

    case "link": {
      const selector = resolveValue(blockData.selector);
      const els = getElements(selector);
      if (!els.length) throw new Error("Link not found");
      const el = els[0] as HTMLAnchorElement;
      if (blockData.openInNewTab) {
        window.open(el.href, '_blank');
      } else {
        el.click();
        if (el.href) window.location.href = el.href;
      }
      return { success: true };
    }

    case "clipboard": {
      if (blockData.type === "get") {
        const text = state.textSelection || window.getSelection()?.toString() || "";
        return { success: true, data: text };
      } else {
        const text = resolveValue(blockData.text);
        const input = document.createElement("textarea");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        return { success: true };
      }
    }

    default:
      console.warn(`[Fluxo] Block type '${blockType}' not fully implemented in content script yet.`);
      return { success: true };
  }
}

export default FluxoContentScript;
