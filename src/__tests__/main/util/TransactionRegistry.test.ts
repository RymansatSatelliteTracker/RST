import TransactionRegistry from "@/main/util/TransactionRegistry";

describe("TransactionRegistry", () => {
  beforeAll(() => {});

  it("ファイルが登録できる", () => {
    // 準備
    const fileType = "testType";
    const tempPath = "/path/to/temp/file";
    // 実行
    TransactionRegistry.register(fileType, tempPath);
    // 検証
    const registeredPath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(registeredPath).toBe(tempPath);
  });
  it("登録済みの場合でも登録できる（後勝ち）", () => {
    // 準備
    const fileType = "testType";
    const tempPath1 = "/path/to/temp/file";
    const tempPath2 = "/path/to/temp/file2";
    // 実行
    TransactionRegistry.register(fileType, tempPath1);
    TransactionRegistry.register(fileType, tempPath2);
    // 検証
    const registeredPath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(registeredPath).toBe(tempPath2);
  });

  it("ファイルが登録解除できる", () => {
    // 準備
    const fileType = "testType";
    const tempPath = "/path/to/temp/file";
    TransactionRegistry.register(fileType, tempPath);
    // 実行
    TransactionRegistry.unregister(fileType);
    // 検証
    const registeredPath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(registeredPath).toBe(null);
  });
  it("登録してない場合何もしない", () => {
    // 準備
    const fileType = "testType";
    // 実行
    TransactionRegistry.unregister(fileType);
    // 検証
    const registeredPath = TransactionRegistry.getActiveTempFilePath(fileType);
    expect(registeredPath).toBe(null);
  });
});
