export interface WaitForOptions {
  selector: string;
  root?: Element | Document;
  condition?: (el: Element) => boolean;
  index?: number | "all";
  invisible?: boolean;
  timeout?: number;
}

export class DOMWatcher {
  private callbacks: Set<() => void>;
  private observer: MutationObserver;
  private scheduled: boolean;

  constructor() {
    this.callbacks = new Set();
    this.observer = new MutationObserver(this._handleMutations.bind(this));
    this.scheduled = false;

    if (document.body) {
      this.observe();
    } else {
      document.addEventListener("DOMContentLoaded", () => this.observe());
    }
  }

  observe(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  private _handleMutations(_mutations: MutationRecord[]): void {
    if (this.scheduled) return;
    this.scheduled = true;

    // Batch updates to avoid processing every single mutation record individually
    requestAnimationFrame(() => {
      this.scheduled = false;
      this._processCallbacks();
    });
  }

  /**
   * Waits for an element to appear or disappear.
   */
  waitFor({
    selector,
    root = document,
    condition,
    index,
    invisible = false,
    timeout = 10000,
  }: WaitForOptions): Promise<Element | Element[] | boolean> {
    return new Promise((resolve, reject) => {
      const check = (): Element | Element[] | boolean | null => {
        if (invisible) {
          // Wait for disappearance
          const elements = root.querySelectorAll(selector);

          // If checking for specific index
          if (typeof index === "number") {
            const el = elements[index];
            if (!el) return true; // Element at index is gone
            if (condition) return !condition(el as Element); // If exists, check if it NO LONGER matches condition
            return false; // Exists and no condition = visible
          }

          // Normal selector check
          if (elements.length === 0) return true; // All gone

          // If condition provided, check if ANY element matches
          if (condition) {
            for (const el of Array.from(elements)) {
              if (condition(el as Element)) return false; // Found one that still matches
            }
            return true; // None match
          }

          return false; // Elements exist and no condition checked = still visible
        } else {
          // Wait for appearance
          try {
            const elements = Array.from(root.querySelectorAll(selector));

            if (index === "all") {
              if (elements.length > 0) return elements as Element[];
            } else if (typeof index === "number") {
              const el = elements[index];
              if (el) {
                if (!condition || condition(el as Element)) return el as Element;
              }
            } else {
              for (const el of elements) {
                if (!condition || condition(el as Element)) return el as Element;
              }
            }
          } catch (e) {
            // Log error if needed or ignore during retry
          }
          return null;
        }
      };

      // Immediate check
      const result = check();
      if (result !== null && result !== false) return resolve(result);

      // Setup callback
      const callback = () => {
        const res = check();
        if (res !== null && res !== false) {
          this._removeCallback(callback);
          clearTimeout(timer);
          resolve(res);
        }
      };

      this.callbacks.add(callback);

      const timer = setTimeout(() => {
        this._removeCallback(callback);
        const action = invisible ? "disappear" : "appear";
        reject(new Error(`[Timeout] Element (${selector}) did not ${action}.`));
      }, timeout);
    });
  }

  private _removeCallback(cb: () => void): void {
    this.callbacks.delete(cb);
  }

  private _processCallbacks(): void {
    if (this.callbacks.size === 0) return;
    for (const cb of this.callbacks) {
      cb();
    }
  }

  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}
