import { AppConfigModel } from "@/common/model/AppConfigModel.js";
import { AppConfigUtil } from "@/main/util/AppConfigUtil.js";
import { FileTransaction } from "@/main/util/FileTransaction.js";
import FileUtil from "@/main/util/FileUtil.js";
import TransactionRegistry from "@/main/util/TransactionRegistry.js";
import { beforeAll, describe, expect, it, vi, type MockInstance } from "vitest";

describe("FileTransaction", () => {
  let wirteTextSpy: MockInstance;
  beforeAll(() => {
    vi.spyOn(AppConfigUtil, "getConfigPath").mockImplementation(() => {
      return "/path/to/config.json";
    });
    vi.spyOn(FileUtil, "copyFile").mockImplementation((_sourcePath, _tempFilePath) => {
      return;
    });
    vi.spyOn(FileUtil, "exists").mockImplementation((_tempFilePath) => {
      return true;
    });
    wirteTextSpy = vi.spyOn(FileUtil, "writeText").mockImplementation((_tempFilePath, _text) => {
      return;
    });
    vi.spyOn(FileUtil, "deleteFile").mockImplementation((_tempFilePath) => {
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
    transaction.update(new AppConfigModel());
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
