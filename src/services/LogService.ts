import { db, type WorkflowLog, type LogData } from '~db';

class LogService {
  private static instance: LogService;

  private constructor() {}

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  async startLog(workflowId: string, name: string): Promise<number> {
    return await db.logs.add({
      workflowId,
      name,
      status: 'running',
      startedAt: Date.now(),
    });
  }

  async finishLog(logId: number, status: 'success' | 'error', message?: string): Promise<void> {
    await db.logs.update(logId, {
      status,
      endedAt: Date.now(),
      message,
    });
  }

  async addLogData(logId: number, data: any): Promise<void> {
    await db.logData.add({
      logId,
      data,
    });
  }

  async getLogsByWorkflow(workflowId: string): Promise<WorkflowLog[]> {
    return await db.logs.where('workflowId').equals(workflowId).reverse().sortBy('startedAt');
  }

  async getLogById(logId: number): Promise<WorkflowLog | undefined> {
    return await db.logs.get(logId);
  }

  async deleteLogsByWorkflow(workflowId: string): Promise<void> {
    const logs = await db.logs.where('workflowId').equals(workflowId).toArray();
    const logIds = logs.map(l => l.id!).filter(id => id);
    
    await db.transaction('rw', db.logs, db.logData, async () => {
      await db.logs.where('workflowId').equals(workflowId).delete();
      await db.logData.where('logId').anyOf(logIds).delete();
    });
  }

  async getAllLogs(): Promise<WorkflowLog[]> {
    return await db.logs.reverse().sortBy('startedAt');
  }
}

export const logService = LogService.getInstance();
