import DateUtil from "@/renderer/util/DateUtil";
import { createPinia, setActivePinia } from "pinia";

/**
 * [正常系]
 * Date型データをフォーマット形式を指定して文字列に変換できる
 */
describe("[正常系]Date型データをフォーマット形式を指定して文字列に変換できる", () => {
  beforeEach(() => {
    // Piniaのモックをセットアップ
    setActivePinia(createPinia());
  });

  afterEach(() => {
    // 必要に応じてクリーンアップ
    setActivePinia(undefined);
  });

  it("Date型データを指定フォーマットで文字列に変換できる", () => {
    // given 前提条件
    const date = new Date("2023-01-01T00:00:00Z");
    // when 実行
    const formatted = DateUtil.formatDateTime(date);
    // then 結果
    expect(formatted).toContain("2023");
  });

  it("undefinedを渡すと'―'を返す", () => {
    // given 前提条件
    // when 実行
    const formatted = DateUtil.formatDateTime(undefined);
    // then 結果
    expect(formatted).toBe("―");
  });
});

/**
 * [正常系]
 * ミリ秒数値をhh:mm:ss形式の文字列に変換できる
 */
describe("[正常系]ミリ秒数値をhh:mm:ss形式の文字列に変換できる", () => {
  beforeEach(() => {
    // Piniaのモックをセットアップ
    setActivePinia(createPinia());
  });

  afterEach(() => {
    // 必要に応じてクリーンアップ
    setActivePinia(undefined);
  });

  it("ミリ秒をhh:mm:ss形式に変換できる", () => {
    // given 前提条件
    // when 実行
    const formatted = DateUtil.formatMsToHHMMSS(3661000);
    // then 結果
    expect(formatted).toBe("01:01:01");
  });

  it("0ミリ秒を渡すと'00:00:00'を返す", () => {
    // given 前提条件
    // when 実行
    const formatted = DateUtil.formatMsToHHMMSS(0);
    // then 結果
    expect(formatted).toBe("00:00:00");
  });

  it("nullを渡すと'―'を返す", () => {
    // given 前提条件
    // when 実行
    const formatted = DateUtil.formatMsToHHMMSS(null);
    // then 結果
    expect(formatted).toBe("―");
  });

  it("負のミリ秒を渡すと'―'を返す", () => {
    // given 前提条件
    // when 実行
    const formatted = DateUtil.formatMsToHHMMSS(-1000);
    // then 結果
    expect(formatted).toBe("―");
  });
});

/**
 * [正常系]
 * ミリ秒数値を単位付き日時文字列に変換できる
 */
describe("[正常系]ミリ秒数値を単位付き日時文字列に変換できる", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    setActivePinia(undefined);
  });

  it("ミリ秒をd h m s形式に変換できる", () => {
    // given
    const milliSeconds = 90061000; // 1d 1h 1m 1s
    // when
    const formatted = DateUtil.formatMsToDHMS(milliSeconds);
    // then
    expect(formatted).toBe("1d 1h 1m 1s");
  });

  it("負のミリ秒を秒表現で返す", () => {
    // given
    const milliSeconds = -3000; // -3s
    // when
    const formatted = DateUtil.formatMsToDHMS(milliSeconds);
    // then
    expect(formatted).toBe("-3s");
  });

  it("0ミリ秒を渡すと'―'を返す", () => {
    // given
    const milliSeconds = 0;
    // when
    const formatted = DateUtil.formatMsToDHMS(milliSeconds);
    // then
    expect(formatted).toBe("―");
  });

  it("nullを渡すと'―'を返す", () => {
    // given
    const milliSeconds = null;
    // when
    const formatted = DateUtil.formatMsToDHMS(milliSeconds);
    // then
    expect(formatted).toBe("―");
  });
});

/**
 * [正常系]
 * 分を加算（減算）できる
 */
describe("[正常系]分を加算（減算）できる", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    setActivePinia(undefined);
  });

  it("指定した分を加算できる", () => {
    // given
    const date = new Date("2023-01-01T00:00:00Z");
    // when
    const newDate = DateUtil.addMinute(date, 10);
    // then
    expect(newDate.toISOString()).toBe("2023-01-01T00:10:00.000Z");
  });

  it("指定した分を減算できる", () => {
    // given
    const date = new Date("2023-01-01T00:10:00Z");
    // when
    const newDate = DateUtil.addMinute(date, -10);
    // then
    expect(newDate.toISOString()).toBe("2023-01-01T00:00:00.000Z");
  });
});

/**
 * [正常系]
 * 秒を加算（減算）できる
 */
describe("[正常系]秒を加算（減算）できる", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    setActivePinia(undefined);
  });

  it("指定した秒を加算できる", () => {
    // given
    const date = new Date("2023-01-01T00:00:00Z");
    // when
    const newDate = DateUtil.addSec(date, 30);
    // then
    expect(newDate.toISOString()).toBe("2023-01-01T00:00:30.000Z");
  });

  it("指定した秒を減算できる", () => {
    // given
    const date = new Date("2023-01-01T00:00:30Z");
    // when
    const newDate = DateUtil.addSec(date, -30);
    // then
    expect(newDate.toISOString()).toBe("2023-01-01T00:00:00.000Z");
  });
});
