import { BaseService } from "./BaseService";
import { storageService } from "./StorageService";

export interface Folder {
  id: string;
  name: string;
}

class FolderService extends BaseService {
  private static instance: FolderService;
  private folders: Folder[] = [];
  private storageService = storageService;

  private constructor() {
    super();
  }

  public static getInstance(): FolderService {
    if (!FolderService.instance) {
      FolderService.instance = new FolderService();
    }
    return FolderService.instance;
  }

  protected async onInitialize(): Promise<void> {
    const data = await this.storageService.get("folders");
    this.folders = data || [];
  }

  public getFolders(): Folder[] {
    return this.folders;
  }

  public getFolder(id: string): Folder | undefined {
    return this.folders.find((f) => f.id === id);
  }

  public async addFolder(name: string): Promise<Folder> {
    const newFolder: Folder = {
      id: Date.now().toString(), // Simple ID generator, could use nanoid later
      name,
    };
    
    this.folders.push(newFolder);
    await this.saveToStorage();
    return newFolder;
  }

  public async updateFolder(id: string, name: string): Promise<Folder | null> {
    const index = this.folders.findIndex((f) => f.id === id);
    if (index === -1) return null;

    this.folders[index].name = name;
    await this.saveToStorage();
    return this.folders[index];
  }

  public async deleteFolder(id: string): Promise<boolean> {
    const index = this.folders.findIndex((f) => f.id === id);
    if (index === -1) return false;

    this.folders.splice(index, 1);
    await this.saveToStorage();
    return true;
  }

  private async saveToStorage() {
    await this.storageService.set("folders", this.folders);
  }
}

export const folderService = FolderService.getInstance();
