import { AppConfigModel } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { FileType } from "@/common/types/types";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import FileUtil from "@/main/util/FileUtil";
import TransactionRegistry from "@/main/util/TransactionRegistry";

export class FileTransaction {
  transactionId: string;
  fileType: FileType;
  constructor(fileType: FileType) {
    this.transactionId = "";
    this.fileType = fileType;
  }
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
  public begin(): void {
    this.transactionId = Date.now().toString();
    const sourcePath = this.fileHandlers[this.fileType].getPath();
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    FileUtil.copyFile(sourcePath, tempFilePath);
    // 一時ファイルを登録する
    TransactionRegistry.register(this.fileType, tempFilePath);
  }
  /**
   * ファイルトランザクションを更新する
   */
  public update(content: any): Promise<void> {
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    const text = this.fileHandlers[this.fileType].stringify(content);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.wirteText(tempFilePath, text);
    return Promise.resolve();
  }
  /**
   * ファイルトランザクションをコミットする
   */
  public commit(): Promise<void> {
    const config = this.fileHandlers[this.fileType].getPath();
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.copyFile(tempFilePath, config);
    FileUtil.deleteFile(tempFilePath);
    // 一時ファイル登録を解除する
    TransactionRegistry.unregister(this.fileType);
    return Promise.resolve();
  }
  /**
   * ファイルトランザクションをロールバックする
   */
  public rollback(): Promise<void> {
    const tempFilePath = this.getTempFilePath(this.fileType, this.transactionId);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.deleteFile(tempFilePath);
    // 一時ファイル登録を解除する
    TransactionRegistry.unregister(this.fileType);
    return Promise.resolve();
  }
  /**
   * 一時ファイルパスを取得する
   */
  private getTempFilePath(fileType: FileType, transactionId: string): string {
    const config = this.fileHandlers[fileType].getPath();
    return `${config}.${transactionId}`;
  }
}
