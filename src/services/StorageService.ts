import browser from "webextension-polyfill";
import { BaseService } from "./BaseService";

class StorageService extends BaseService {
  private static instance: StorageService;

  private constructor() {
    super();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  protected async onInitialize(): Promise<void> {
    console.log("StorageService initialized");
  }

  public async get(key: string): Promise<any> {
    const result = await browser.storage.local.get(key);
    return result[key];
  }

  public async set(key: string, value: any): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }
}

export const storageService = StorageService.getInstance();
