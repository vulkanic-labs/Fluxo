export abstract class BaseService {
  protected isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.onInitialize();
    this.isInitialized = true;
  }

  protected abstract onInitialize(): Promise<void>;
}
