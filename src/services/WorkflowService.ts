import browser from "webextension-polyfill";
import { BaseService } from "./BaseService";

export interface Workflow {
  id: string;
  name: string;
  icon: string;
  folderId: string | null;
  content: any;
  drawflow: any;
  createdAt: number;
  updatedAt: number;
  isDisabled: boolean;
  settings: any;
  version: string;
  globalData: string;
}

class WorkflowService extends BaseService {
  private static instance: WorkflowService;
  private workflows: Record<string, Workflow> = {};
  private isFirstTime: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  protected async onInitialize(): Promise<void> {
    const data = await browser.storage.local.get(["workflows", "isFirstTime"]);
    this.workflows = (data.workflows as Record<string, Workflow>) || {};
    this.isFirstTime = (data.isFirstTime as boolean) ?? true;

    if (this.isFirstTime) {
      // Logic for first time initialization could go here
      await browser.storage.local.set({ isFirstTime: false });
    }
    console.log("WorkflowService initialized");
  }

  public getWorkflows(): Workflow[] {
    return Object.values(this.workflows);
  }

  public getWorkflowById(id: string): Workflow | undefined {
    return this.workflows[id];
  }

  public async insertWorkflow(workflow: Workflow): Promise<void> {
    this.workflows[workflow.id] = workflow;
    await this.saveToStorage();
  }

  public async updateWorkflow(id: string, data: Partial<Workflow>): Promise<void> {
    if (this.workflows[id]) {
      this.workflows[id] = { ...this.workflows[id], ...data, updatedAt: Date.now() };
      await this.saveToStorage();
    }
  }

  public async deleteWorkflow(id: string): Promise<void> {
    delete this.workflows[id];
    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    await browser.storage.local.set({ workflows: this.workflows });
  }
}

export const workflowService = WorkflowService.getInstance();
