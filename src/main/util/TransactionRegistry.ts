export default class TransactionRegistry {
  private static map: Record<string, string> = {};

  public static register(fileType: string, tempPath: string): void {
    if (this.map[fileType]) {
      throw new Error(`ファイルタイプ${fileType}はすでに登録されています`);
    }
    this.map[fileType] = tempPath;
  }

  public static unregister(fileType: string): void {
    if (!this.map[fileType]) {
      throw new Error(`ファイルタイプ${fileType}は登録されていません`);
    }
    delete this.map[fileType];
  }

  public static getActiveTempFilePath(fileType: string): string | null {
    return this.map[fileType] ?? null;
  }
}
