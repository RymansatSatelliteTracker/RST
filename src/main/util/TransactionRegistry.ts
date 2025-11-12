export default class TransactionRegistry {
  private static map: Record<string, string> = {};

  /**
   * トランザクションファイルの登録
   * ファイルが登録済みの場合後勝ち
   * @param fileType
   * @param tempPath
   */
  public static register(fileType: string, tempPath: string): void {
    this.map[fileType] = tempPath;
  }

  /**
   * トランザクションファイルの登録解除
   * @param fileType
   */
  public static unregister(fileType: string): void {
    if (!this.map[fileType]) {
      return;
    }
    delete this.map[fileType];
  }

  /**
   * 登録中のトランザクションファイルの取得
   * @param fileType
   * @returns
   */
  public static getActiveTempFilePath(fileType: string): string | null {
    return this.map[fileType] ?? null;
  }
}
