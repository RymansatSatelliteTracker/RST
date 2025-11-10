import { AppConfigModel } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import { FileType } from "@/common/types/types";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import AppMainLogger from "@/main/util/AppMainLogger";
import FileUtil from "@/main/util/FileUtil";
import TransactionRegistry from "@/main/util/TransactionRegistry";

export class FileTransaction {
  private static fileHandlers = {
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
  public static begin(fileType: FileType): Promise<string> {
    const transactionId: string = Date.now().toString();
    const sourcePath = this.fileHandlers[fileType].getPath();
    const tempFilePath = this.getTempFilePath(fileType, transactionId);
    FileUtil.copyFile(sourcePath, tempFilePath);
    AppMainLogger.info(
      `FileTransaction: ${fileType}のトランザクションを開始しました。transactionId=${transactionId}、filePath=${tempFilePath}`
    );
    // 一時ファイルを登録する
    TransactionRegistry.register(fileType, tempFilePath);
    return Promise.resolve(transactionId);
  }
  /**
   * ファイルトランザクションを更新する
   */
  public static update(fileType: FileType, transactionId: string, content: any): Promise<void> {
    const tempFilePath = this.getTempFilePath(fileType, transactionId);
    const text = this.fileHandlers[fileType].stringify(content);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.wirteText(tempFilePath, text);
    return Promise.resolve();
  }
  /**
   * ファイルトランザクションをコミットする
   */
  public static commit(fileType: FileType, transactionId: string): Promise<void> {
    const config = this.fileHandlers[fileType].getPath();
    const tempFilePath = this.getTempFilePath(fileType, transactionId);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.copyFile(tempFilePath, config);
    FileUtil.deleteFile(tempFilePath);
    // 一時ファイル登録を解除する
    TransactionRegistry.unregister(fileType);
    return Promise.resolve();
  }
  /**
   * ファイルトランザクションをロールバックする
   */
  public static rollback(fileType: FileType, transactionId: string): Promise<void> {
    const tempFilePath = this.getTempFilePath(fileType, transactionId);
    if (!FileUtil.exists(tempFilePath)) {
      return Promise.reject(new Error("トランザクションファイルが存在しません"));
    }
    FileUtil.deleteFile(tempFilePath);
    // 一時ファイル登録を解除する
    TransactionRegistry.unregister(fileType);
    return Promise.resolve();
  }
  /**
   * 一時ファイルパスを取得する
   */
  private static getTempFilePath(fileType: FileType, transactionId: string): string {
    const config = this.fileHandlers[fileType].getPath();
    return `${config}.${transactionId}`;
  }
}
