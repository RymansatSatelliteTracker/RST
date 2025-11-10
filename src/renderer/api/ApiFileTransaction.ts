import { FileType } from "@/common/types/types";

/**
 * メイン表示する衛星関係のレンダラ側API
 */
export default class ApiFileTransaction {
  private transactionId: string;
  private fileType: string;
  constructor(fileType: FileType) {
    this.fileType = fileType;
    this.transactionId = "";
  }
  /**
   * トランザクションを開始する
   */
  async begin(): Promise<void> {
    this.transactionId = await window.rstApi.beginTransaction(this.fileType);
  }

  /**
   * トランザクションを更新する
   */
  async update(content: any): Promise<void> {
    if (this.transactionId === "") {
      throw new Error("トランザクションが開始されていません");
    }
    await window.rstApi.updateTransaction(this.fileType, this.transactionId, content);
  }

  /**
   * トランザクションをコミットする
   */
  async commit(): Promise<void> {
    if (this.transactionId === "") {
      throw new Error("トランザクションが開始されていません");
    }
    await window.rstApi.commitTransaction(this.fileType, this.transactionId);
    this.transactionId = "";
  }

  /**
   * トランザクションをロールバックする
   */
  async rollback(): Promise<void> {
    if (this.transactionId === "") {
      throw new Error("トランザクションが開始されていません");
    }
    await window.rstApi.rollbackTransaction(this.fileType, this.transactionId);
    this.transactionId = "";
  }
}
