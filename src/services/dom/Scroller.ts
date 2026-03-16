/**
 * Utility to handle complex scrolling interactions, including infinite scroll and smooth scrolling.
 */
export interface ScrollerOptions {
  element?: HTMLElement | Window;
}

export interface ScrollToBottomOptions {
  timeout?: number;
  stepDistance?: number;
  stepDelay?: number;
}

export interface ScrollUntilOptions {
  timeout?: number;
  direction?: "down" | "up";
  speed?: number;
}

export class Scroller {
  private scrollContainer: HTMLElement | Window;

  constructor(options: ScrollerOptions = {}) {
    this.scrollContainer = options.element || window;
  }

  /**
   * Scrolls to the bottom of the page/element progressively, waiting for new content to load.
   * Useful for infinite scroll pages.
   */
  async scrollToBottom({
    timeout = 10000,
    stepDistance = 100,
    stepDelay = 50,
  }: ScrollToBottomOptions = {}): Promise<boolean> {
    let lastScrollHeight = this._getScrollHeight();
    let noChangeTime = 0;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const currentScrollTop = this._getScrollTop();
      const maxScroll = lastScrollHeight - this._getClientHeight();

      // If we are not at the bottom, scroll down
      if (currentScrollTop < maxScroll) {
        this._scrollBy(stepDistance);
        await this._delay(stepDelay);
        noChangeTime = 0; // Reset no change timer if we moved
      } else {
        // We are at the bottom, wait to see if content loads
        await this._delay(500);
        const newScrollHeight = this._getScrollHeight();

        if (newScrollHeight > lastScrollHeight) {
          // Content loaded, continue scrolling
          lastScrollHeight = newScrollHeight;
          noChangeTime = 0;
        } else {
          // No new content after waiting
          noChangeTime += 500;
          if (noChangeTime >= 2000) {
            // Assert stable bottom for 2 seconds
            return true;
          }
        }
      }
    }

    return false; // Timed out
  }

  /**
   * Scrolls until a condition is met.
   */
  async scrollUntil(
    conditionFn: () => Promise<boolean> | boolean,
    { timeout = 10000, direction = "down", speed = 50 }: ScrollUntilOptions = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    const step = direction === "down" ? speed : -speed;

    while (Date.now() - startTime < timeout) {
      if (await conditionFn()) return true;

      const canScroll =
        direction === "down"
          ? this._getScrollTop() < this._getScrollHeight() - this._getClientHeight()
          : this._getScrollTop() > 0;

      if (!canScroll) return false; // Reached end/top without condition met

      this._scrollBy(step);
      await this._delay(50);
    }
    return false;
  }

  /**
   * Smoothly scrolls to a specific element.
   */
  async smoothScroll(target: Element | string): Promise<void> {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("Target element not found");

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await this._delay(500); // Wait for scroll animation
  }

  private _getScrollHeight(): number {
    return this.scrollContainer === window
      ? document.documentElement.scrollHeight
      : (this.scrollContainer as HTMLElement).scrollHeight;
  }

  private _getScrollTop(): number {
    return this.scrollContainer === window
      ? window.scrollY
      : (this.scrollContainer as HTMLElement).scrollTop;
  }

  private _getClientHeight(): number {
    return this.scrollContainer === window
      ? window.innerHeight
      : (this.scrollContainer as HTMLElement).clientHeight;
  }

  private _scrollBy(amount: number): void {
    this.scrollContainer.scrollBy(0, amount);
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
