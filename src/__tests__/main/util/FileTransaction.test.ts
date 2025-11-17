import { AppConfigUtil } from "@/main/util/AppConfigUtil";
import { FileTransaction } from "@/main/util/FileTransaction";
import FileUtil from "@/main/util/FileUtil";
import TransactionRegistry from "@/main/util/TransactionRegistry";

describe("FileTransaction", () => {
  let wirteTextSpy: jest.SpyInstance;
  beforeAll(() => {
    jest.spyOn(AppConfigUtil, "getConfigPath").mockImplementation(() => {
      return "/path/to/config.json";
    });
    jest.spyOn(FileUtil, "copyFile").mockImplementation((sourcePath, tempFilePath) => {
      return;
    });
    jest.spyOn(FileUtil, "exists").mockImplementation((tempFilePath) => {
      return true;
    });
    wirteTextSpy = jest.spyOn(FileUtil, "writeText").mockImplementation((tempFilePath, text) => {
      return;
    });
    jest.spyOn(FileUtil, "deleteFile").mockImplementation((tempFilePath) => {
      return;
    });
  });

  it("ファイルトランザクションを開始できる", () => {
    // 準備
    const fileType = "appConfig";
    const beforeFilePath = TransactionRegistry.getActiveTempFilePath(fileType);
    // 実行
    new FileTransaction(fileType);
    // 検証
    const filePath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(beforeFilePath).toBeNull();
    expect(filePath).not.toBeNull();
  });
  it("トランザクションファイルを更新できる", () => {
    // 準備
    const fileType = "appConfig";
    const transaction = new FileTransaction(fileType);
    // 実行
    transaction.update({ some: "data" });
    // 検証
    expect(wirteTextSpy).toHaveBeenCalledTimes(1);
  });
  it("トランザクションファイルをコミットできる", () => {
    // 準備
    const fileType = "appConfig";
    const transaction = new FileTransaction(fileType);
    const beforeFilePath = TransactionRegistry.getActiveTempFilePath(fileType);
    // 実行
    transaction.commit();
    // 検証
    const filePath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(beforeFilePath).not.toBeNull();
    expect(filePath).toBeNull();
  });
  it("トランザクションファイルをロールバックできる", () => {
    // 準備
    const fileType = "appConfig";
    const transaction = new FileTransaction(fileType);
    const beforeFilePath = TransactionRegistry.getActiveTempFilePath(fileType);
    // 実行
    transaction.rollback();
    // 検証
    const filePath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(beforeFilePath).not.toBeNull();
    expect(filePath).toBeNull();
  });
});
