import {
  parseTle,
  validateParsedTle,
} from "@/renderer/components/organisms/setting/SatelliteSetting/DisplaySatellite/RegistSatellite/useValidateTle";

/**
 * [正常系]TLEチェック
 * ISSのデータ
 */
test("ok_iss", () => {
  const tleLine1: string = "1 25544U 98067A   24279.46943132  .00032942  00000+0  59769-3 0  9994";
  const tleLine2: string = "2 25544  51.6363 129.1425 0009147  39.7917 320.3740 15.49242162475659";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);
  // 入力チェック関係
  expect(error).toBe(null);
});

/**
 * [正常系]TLEチェック
 * データほぼなし
 */
test("ok_min", () => {
  const tleLine1: string = "1 00001U 00001A   00000.07448344  .00013583  00000-0  23593-3 0    10";
  const tleLine2: string = "2 00001   0.0000   0.0000 0000001   0.0000   0.0000  0.00000000    11";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);
  // 入力チェック関係
  expect(error).toBe(null);
});

/**
 * [正常系]TLEチェック
 * データ最大
 */
test("ok_min", () => {
  const tleLine1: string = "1 99999A 99999AAA 99280.07448344 +.00013583  00000+0 +23593+3 0 19996";
  const tleLine2: string = "2 25544 151.6370 126.1446 0008819 101.2181 154.7781 15.49284657475746";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);
  // 入力チェック関係
  expect(error).toBe(null);
});

/**
 * [異常系]TLEチェック
 * 1行目のみ
 */
test("invalid_1st_record", () => {
  const tleLine1: string = "1 99999A 99999AAA 99280.07448344 +.00013583  00000+0 +23593+3 0 19996";
  const tleLine2: string = "";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);

  // 入力チェック関係
  expect(error?.error.name).toBe("lineNumber");
});

/**
 * [異常系]TLEチェック
 * 1行目不正
 */
test("invalid_2st_record", () => {
  const tleLine1: string = "1 99999A 99999AAA 99280.07448344 +.00013583  00000+0 +23593+3 0 1999";
  const tleLine2: string = "2 25544 151.6370 126.1446 0008819 101.2181 154.7781 15.49284657475746";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);
  // 入力チェック関係
  expect(error?.error.name).toBe("checkSum");
});

/**
 * [異常系]TLEチェック
 * 2行目不正
 */
test("invalid_1st_record", () => {
  const tleLine1: string = "1 99999A 99999AAA 99280.07448344 +.00013583  00000+0 +23593+3 0 19996";
  const tleLine2: string = "2 25544 151.6370 126.1446 0008819 101.2181 154.7781 15.4928465747574";
  const tle = parseTle(tleLine1, tleLine2);
  const error = validateParsedTle(tle);
  // 入力チェック関係
  expect(error?.error.name).toBe("checkSum");
});
