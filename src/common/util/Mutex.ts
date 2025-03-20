/**
 * Mutex
 */
export class Mutex {
  private locked = false;
  private waiting: (() => void)[] = [];

  /**
   * ロック
   */
  public async lock(): Promise<void> {
    return new Promise((resolve) => {
      // ロックされている場合は、待機リストに追加
      if (this.locked) {
        this.waiting.push(resolve);
        return;
      }

      // ロックされてない場合は、ロックを取得
      this.locked = true;
      resolve();
    });
  }

  /**
   * アンロック
   */
  public unlock(): void {
    // 待機リストがある場合は、そのリストの先頭を実行
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        next();
      }

      return;
    }

    this.locked = false;
  }
}
