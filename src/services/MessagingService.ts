import browser from "webextension-polyfill";
import { BaseService } from "./BaseService";

class MessagingService extends BaseService {
  private static instance: MessagingService;

  private constructor() {
    super();
  }

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  protected async onInitialize(): Promise<void> {
    console.log("MessagingService initialized");
  }

  public async sendMessage(action: string, payload?: any): Promise<any> {
    return browser.runtime.sendMessage({ action, payload });
  }

  public async sendToTab(tabId: number, action: string, payload?: any): Promise<any> {
    return browser.tabs.sendMessage(tabId, { action, payload });
  }

  public onMessage(action: string, callback: (payload: any, sender: browser.Runtime.MessageSender) => Promise<any> | void) {
    browser.runtime.onMessage.addListener((message, sender) => {
      if (message.action === action) {
        return Promise.resolve(callback(message.payload, sender));
      }
    });
  }
}

export const messagingService = MessagingService.getInstance();
