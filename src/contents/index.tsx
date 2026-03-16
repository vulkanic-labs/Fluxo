import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import cssText from "data-text:~style.css";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { DOMWatcher } from "~services/dom/DOMWatcher";
import { Scroller } from "~services/dom/Scroller";

// Shared instances for the content script
const watcher = new DOMWatcher();
const scroller = new Scroller();

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

  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Content Script Block Execution Logic
// ──────────────────────────────────────────────────────────────────────────────

async function handleBlockExecution(
  { blockType, blockData, variables, tableData }: any, 
  state: { contextElement: Element | null, textSelection: string },
  context: Element | Document = document
): Promise<any> {
  console.log(`[Fluxo] Executing block: ${blockType}`, blockData);

  const resolveValue = (v: any): any => {
    if (v === undefined || v === null) return v;
    if (typeof v !== "string") return v;
    
    // Support {{variableName}}
    let resolved = v.replace(/\{\{(.+?)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      if (variables[trimmed] !== undefined) return String(variables[trimmed]);
      return `{{${key}}}`;
    });

    // Support variables.path.to.value (often used for indices or message strings)
    if (resolved.includes("variables.")) {
      const parts = resolved.split(".");
      if (parts[0] === "variables") {
        let current: any = variables;
        for (let i = 1; i < parts.length; i++) {
          if (current[parts[i]] !== undefined) {
            current = current[parts[i]];
          } else {
            return resolved; // Fallback to original if path fails
          }
        }
        return current;
      }
    }

    return resolved;
  };

  /**
   * Helper to execute a sequence of steps (used by action-chain and postActions)
   */
  const executeSteps = async (steps: any[], currentContext: Element | Document) => {
    let ctx = currentContext;
    for (const step of steps) {
      const blockParams = step.params || {};
      // Some legacy workflows use top-level selector instead of params.selector
      const blockDataToPass = { ...blockParams };
      if (step.selector && !blockDataToPass.selector) blockDataToPass.selector = step.selector;

      const result = await handleBlockExecution(
        { 
          blockType: step.action, 
          blockData: blockDataToPass, 
          variables, 
          tableData 
        }, 
        state, 
        ctx
      );
      
      // Context chaining: if the action returned an element, use it as context for next steps
      if (result && (result instanceof Element || result.element instanceof Element)) {
        ctx = result.element || result;
      }
    }
  };

  switch (blockType) {
    case "action-chain": {
      const steps = blockData.steps || [];
      await executeSteps(steps, context);
      return { success: true };
    }

    case "wait":
    case "wait-element": {
      const selector = resolveValue(blockData.selector);
      const timeout = Number(blockData.timeout) || 10000;
      const invisible = blockData.invisible || false;
      const resolvedIndex = resolveValue(blockData.index);
      const index = resolvedIndex === "all" ? "all" : (isNaN(Number(resolvedIndex)) ? undefined : Number(resolvedIndex));
      
      const condition = blockData.condition === "element_match" ? (el: Element) => {
        const textToMatch = resolveValue(blockData.conditionParams?.text);
        if (textToMatch) {
          return el.textContent?.toLowerCase().includes(textToMatch.toLowerCase()) || false;
        }
        return true;
      } : undefined;

      try {
        const result = await watcher.waitFor({ 
          selector, 
          root: context, 
          timeout, 
          invisible, 
          index,
          condition
        });

        // 1. Handle saveCountTo
        if (blockData.saveCountTo && Array.isArray(result)) {
          variables[blockData.saveCountTo] = result.length;
        }

        // 2. Handle extract
        if (blockData.extract && result && !invisible) {
          const el = Array.isArray(result) ? result[0] : (result as Element);
          const prop = blockData.extract.property || "innerText";
          const val = (el as any)[prop]?.trim() || "";
          if (blockData.extract.saveTo) {
            variables[blockData.extract.saveTo] = val;
          }
        }

        // 3. Handle preEvents
        if (blockData.preEvents && result && !invisible) {
          const els = Array.isArray(result) ? result : [result as Element];
          for (const el of els) {
            for (const eventType of blockData.preEvents) {
              el.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
            }
          }
        }

        // 4. Handle saveTo (element reference)
        if (blockData.saveTo && result && !invisible) {
          // Note: Variable storage for DOM elements might be limited, but we track locally
          // for the duration of handleBlockExecution.
        }

        // 5. Handle postActions (Recursive Chain)
        if (blockData.postActions && result && !invisible) {
          const els = Array.isArray(result) ? result : [result as Element];
          // Usually execute on the first match if multiple
          await executeSteps(blockData.postActions, els[0]);
        }

        return { success: true, element: Array.isArray(result) ? result[0] : result };
      } catch (err: any) {
        if (blockData.optional) return { success: true, nextOutput: "output-2" };
        throw err;
      }
    }

    case "event-click":
    case "click": {
      const selector = resolveValue(blockData.selector);
      const timeout = Number(blockData.timeout) || 5000;
      
      const el = await (selector 
        ? watcher.waitFor({ selector, root: context, timeout }) 
        : Promise.resolve(context instanceof Element ? context : null));

      if (!(el instanceof HTMLElement)) throw new Error("Target element not found or not clickable");
      
      el.click();
      if (blockData.waitAfter) await new Promise(r => setTimeout(r, Number(blockData.waitAfter)));
      return { success: true, element: el };
    }

    case "right_click": {
      const selector = resolveValue(blockData.selector);
      const el = await (selector 
        ? watcher.waitFor({ selector, root: context }) 
        : Promise.resolve(context instanceof Element ? context : null));

      if (!(el instanceof HTMLElement)) throw new Error("Element not found");
      el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
      if (blockData.waitAfter) await new Promise(r => setTimeout(r, Number(blockData.waitAfter)));
      return { success: true, element: el };
    }

    case "hover-element": {
      const selector = resolveValue(blockData.selector);
      const el = await (selector 
        ? watcher.waitFor({ selector, root: context }) 
        : Promise.resolve(context instanceof Element ? context : null));

      if (!(el instanceof HTMLElement)) throw new Error("Element not found");
      el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      return { success: true, element: el };
    }

    case "log": {
      const msg = resolveValue(blockData.message);
      console.log(`[Fluxo Log] ${msg}`);
      return { success: true };
    }

    case "get-text": {
      const selector = resolveValue(blockData.selector);
      const multiple = blockData.multiple;
      
      const result = await watcher.waitFor({ 
        selector, 
        root: context, 
        index: multiple ? "all" : 0, 
        timeout: blockData.optional ? 1000 : 10000 
      }).catch(() => null);

      if (!result && !blockData.optional) throw new Error("Element not found");
      
      const els = Array.isArray(result) ? result : (result ? [result] : []);
      const property = blockData.property || "innerText";
      const texts = els.map(e => (e as any)[property]?.trim() || "");
      const finalVal = multiple ? texts : texts[0] || "";

      const updates: any = {};
      if (blockData.assignVariable && blockData.variableName) {
        updates.variables = { [blockData.variableName]: finalVal };
      }
      if (blockData.saveToTable && blockData.columnName) {
        updates.tableData = { [blockData.columnName]: multiple ? finalVal : [finalVal] };
      }
      return { success: true, ...updates, element: els[0] };
    }

    case "forms": {
      const selector = resolveValue(blockData.selector);
      const el = await (selector 
        ? watcher.waitFor({ selector, root: context }) 
        : Promise.resolve(context instanceof Element ? context : null)) as HTMLInputElement;

      if (!el) throw new Error("Element not found");

      if (blockData.getValue) {
        const val = el.value || el.getAttribute("value") || "";
        const updates: any = {};
        if (blockData.variableName) updates.variables = { [blockData.variableName]: val };
        return { success: true, ...updates, element: el };
      }

      const val = resolveValue(blockData.value);
      el.focus();
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (blockData.submitAfter) el.form?.submit();
      return { success: true, element: el };
    }

    case "element-exists": {
      const selector = resolveValue(blockData.selector);
      const timeout = Number(blockData.timeout) || 3000;
      const invisible = blockData.invisible || false;
      
      try {
        await watcher.waitFor({ selector, root: context, timeout, invisible });
        return { success: true, nextOutput: "output-1" };
      } catch {
        return { success: true, nextOutput: "output-2" };
      }
    }

    case "element-scroll": {
      const selector = resolveValue(blockData.selector);
      const distance = Number(blockData.distance) || 0;
      const type = blockData.scrollType || "bottom"; // bottom, top, element, amount

      if (type === "bottom") {
        await scroller.scrollToBottom({ timeout: blockData.timeout });
      } else if (type === "element" && selector) {
        await scroller.smoothScroll(selector);
      } else {
        const container = selector ? (document.querySelector(selector) as HTMLElement) : window;
        container.scrollBy({ top: distance, behavior: "smooth" });
      }
      return { success: true };
    }

    case "javascript-code": {
      const code = resolveValue(blockData.code);
      const script = `
        (async () => {
          const variables = ${JSON.stringify(variables)};
          const tableData = ${JSON.stringify(tableData)};
          
          function automaNextBlock(data) {
            window.dispatchEvent(new CustomEvent('fluxo:next', { detail: { data, variables, tableData } }));
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

    case "link": {
      const selector = resolveValue(blockData.selector);
      const el = await watcher.waitFor({ selector, root: context }) as HTMLAnchorElement;
      if (!el) throw new Error("Link not found");
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
      console.warn(`[Fluxo] Block type '${blockType}' not fully implemented or handled.`);
      return { success: true };
  }
}

export default FluxoContentScript;
