import { AppConfigModel } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { FileType } from "@/common/types/types";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";
import FileUtil from "@/main/util/FileUtil";
import TransactionRegistry from "@/main/util/TransactionRegistry";

/**
 * ファイルをトランザクション管理するクラス
 */
export class FileTransaction {
  transactionId: string;
  fileType: FileType;

  constructor(fileType: FileType) {
    this.transactionId = "";
    this.fileType = fileType;
    // begin忘れ防止のためコンストラクタの時点で実行
    this.begin();
  }

  /**
   * ファイルタイプごとにメソッドの処理を変更するハンドラ群
   */
  private fileHandlers = {
    appConfig: {
      getPath: () => AppConfigUtil.getConfigPath(),
      stringify: (content: AppConfigModel) => JSON.stringify({ param: content }, null, 2),
    },
    appConfigSatSet: {
      getPath: () => AppConfigUtil.getConfigPath(),
      stringify: (content: AppConfigSatSettingModel) =>
        JSON.stringify({ param: AppConfigUtil.transformSatelliteGroups(content) }, null, 2),
    },
  };

  /**
   * ファイルトランザクションを開始する
   */
  private begin(): void {
    this.transactionId = Date.now().toString();
    AppMainLogger.info(`ファイルトランザクション開始: ${this.fileType}, transactionId=${this.transactionId}`);
    const sourcePath = this.fileHandlers[this.fileType].getPath();
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    FileUtil.copyFile(sourcePath, tempFilePath);
    // 一時ファイルを登録する
    TransactionRegistry.register(this.fileType, tempFilePath);
  }

  /**
   * ファイルトランザクションを更新する
   * 処理が失敗した場合は設定が反映されていない（ロールバック）ことを保証する
   */
  public update(content: any): void {
    AppMainLogger.info(`ファイルトランザクション更新: ${this.fileType}, transactionId=${this.transactionId}`);
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    const text = this.fileHandlers[this.fileType].stringify(content);
    if (!FileUtil.exists(tempFilePath)) {
      // 不整合が起きている可能性があるので登録解除はしておく
      TransactionRegistry.unregister(this.fileType);
      throw new Error(
        `トランザクションファイルが存在しません: filetype=${this.fileType}, transactionId=${this.transactionId}`
      );
    }
    FileUtil.writeText(tempFilePath, text);
  }

  /**
   * ファイルトランザクションをコミットする
   * 処理が失敗した場合は設定が反映されていない（ロールバック）ことを保証する
   */
  public commit(): void {
    AppMainLogger.info(`ファイルトランザクションコミット: ${this.fileType}, transactionId=${this.transactionId}`);
    const config = this.fileHandlers[this.fileType].getPath();
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    if (!FileUtil.exists(tempFilePath)) {
      // 不整合が起きている可能性があるので登録解除はしておく
      TransactionRegistry.unregister(this.fileType);
      throw new Error(`トランザクションファイルが存在しません: ${this.fileType}, transactionId=${this.transactionId}`);
    }
    FileUtil.copyFile(tempFilePath, config);
    FileUtil.deleteFile(tempFilePath);
    // 一時ファイル登録を解除する
    TransactionRegistry.unregister(this.fileType);
  }

  /**
   * ファイルトランザクションをロールバックする
   */
  public rollback(): void {
    AppMainLogger.info(`ファイルトランザクションロールバック: ${this.fileType}, transactionId=${this.transactionId}`);
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    // 一時ファイル登録を解除する
    // 以降ではロールバック（一時ファイルが削除）された状態が保証されているため先に登録解除する
    TransactionRegistry.unregister(this.fileType);

    if (!FileUtil.exists(tempFilePath)) {
      AppMainLogger.error(
        `トランザクションファイルが存在しません: ${this.fileType}, transactionId=${this.transactionId}`
      );
      return;
    }
    FileUtil.deleteFile(tempFilePath);
  }

  /**
   * 一時ファイルパスを取得する
   */
  private getTempFilePath(fileType: FileType, transactionId: string): string {
    const config = this.fileHandlers[fileType].getPath();
    return `${config}.${transactionId}`;
  }
}
