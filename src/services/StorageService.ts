import browser from 'webextension-polyfill';
import { db, type Variable, type DataTable, type TableRow } from '~db';

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // --- Base Storage (chrome.storage.local) ---

  async get(key: string): Promise<any> {
    const result = await browser.storage.local.get(key);
    return result[key];
  }

  async set(key: string, value: any): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  // --- Variables ---

  async getVariable(name: string): Promise<any> {
    const variable = await db.variables.where('name').equals(name).first();
    return variable?.value;
  }

  async setVariable(name: string, value: any): Promise<void> {
    await db.variables.put({ name, value });
  }

  async getAllVariables(): Promise<Record<string, any>> {
    const vars = await db.variables.toArray();
    return vars.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {});
  }

  async deleteVariable(name: string): Promise<void> {
    await db.variables.where('name').equals(name).delete();
  }

  // --- Tables ---

  async createTable(name: string): Promise<number> {
    return await db.collections.add({
      name,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }

  async getTables(): Promise<DataTable[]> {
    return await db.collections.toArray();
  }

  async deleteTable(tableId: number): Promise<void> {
    await db.transaction('rw', db.collections, db.tableRows, async () => {
      await db.collections.delete(tableId);
      await db.tableRows.where('tableId').equals(tableId).delete();
    });
  }

  async addTableRow(tableId: number, data: Record<string, any>): Promise<number> {
    const rowId = await db.tableRows.add({ tableId, data });
    await db.collections.update(tableId, { modifiedAt: Date.now() });
    return rowId;
  }

  async getTableRows(tableId: number): Promise<TableRow[]> {
    return await db.tableRows.where('tableId').equals(tableId).toArray();
  }

  async clearTable(tableId: number): Promise<void> {
    await db.tableRows.where('tableId').equals(tableId).delete();
    await db.collections.update(tableId, { modifiedAt: Date.now() });
  }
}

export const storageService = StorageService.getInstance();
