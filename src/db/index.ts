import Dexie, { type Table } from 'dexie';

export interface WorkflowLog {
  id?: number;
  workflowId: string;
  name: string;
  status: 'success' | 'error' | 'running';
  startedAt: number;
  endedAt?: number;
  message?: string;
  collectionId?: string;
}

export interface LogData {
  id?: number;
  logId: number;
  data: any;
}

export interface DataTable {
  id?: number;
  name: string;
  createdAt: number;
  modifiedAt: number;
}

export interface TableRow {
  id?: number;
  tableId: number;
  data: Record<string, any>;
}

export interface Variable {
  id?: number;
  name: string;
  value: any;
}

export class FluxoDB extends Dexie {
  logs!: Table<WorkflowLog>;
  logData!: Table<LogData>;
  collections!: Table<DataTable>;
  tableRows!: Table<TableRow>;
  variables!: Table<Variable>;

  constructor() {
    super('FluxoDB');
    this.version(1).stores({
      logs: '++id, workflowId, name, status, startedAt, endedAt',
      logData: '++id, logId',
      collections: '++id, name, createdAt, modifiedAt',
      tableRows: '++id, tableId',
      variables: '++id, &name',
    });
  }
}

export const db = new FluxoDB();
