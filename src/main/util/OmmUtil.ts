import CommonUtil from "@/common/CommonUtil.js";
import Constant from "@/common/Constant.js";
import { OmmItem } from "@/common/model/OmmModel.js";
import type { StringMap } from "@/common/types/types.js";
import TleUtil from "@/main/util/TleUtil.js";
import type { TleStrings } from "@/renderer/types/satellite-type.js";

// 軌道要素データの形式
export type OmmFormat = "TLE" | "XML" | "KVN" | "JSON" | "CSV" | "UNKNOWN";

/**
 * OMM(Orbit Mean-elements Message)関係のユーティリティ
 * TLE/3LE/2LE/XML/KVN/JSON/JSON-PRETTY/CSV形式の自動判別、OmmItemへの変換、
 * OmmItemからTLE文字列への変換を行う
 * @class OmmUtil
 */
class OmmUtil {
  /**
   * 軌道要素データのテキストから形式を判別する
   * @param {string} text 軌道要素データのテキスト
   * @returns {OmmFormat} 判別した形式
   */
  public static detectFormat(text: string): OmmFormat {
    const trimmed = (text ?? "").trim();
    if (CommonUtil.isEmpty(trimmed)) {
      return "UNKNOWN";
    }

    // XML: "<?xml"、または"<ndm"/"<omm"から始まる
    if (/^<\?xml/i.test(trimmed) || /^<ndm[\s>]/i.test(trimmed) || /^<omm[\s>]/i.test(trimmed)) {
      return "XML";
    }

    // JSON / JSON-PRETTY: "{"または"["から始まる
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return "JSON";
    }

    // KVN: "CCSDS_OMM_VERS"、または"KEY = VALUE"形式の行を含む
    if (/^CCSDS_OMM_VERS\b/m.test(trimmed) || /^[A-Z][A-Z0-9_]*\s*=.*$/m.test(trimmed)) {
      return "KVN";
    }

    // TLE/3LE/2LE: "1 "で始まる行の次行が"2 "で始まる組がある
    const lines = trimmed
      .split(/\r\n|\r|\n/)
      .map((line) => line)
      .filter((line) => !CommonUtil.isEmpty(line.trim()));
    for (let ii = 0; ii < lines.length - 1; ii++) {
      if (lines[ii].substring(0, 2) === "1 " && lines[ii + 1].substring(0, 2) === "2 ") {
        return "TLE";
      }
    }

    // CSV: ヘッダー行に"OBJECT_NAME"とカンマを含む
    if (lines.length > 0 && lines[0].includes(",") && /\bOBJECT_NAME\b/.test(lines[0])) {
      return "CSV";
    }

    return "UNKNOWN";
  }

  /**
   * 軌道要素データのテキストをOmmItemのリストに変換する
   * @param {string} text 軌道要素データのテキスト
   * @returns {OmmItem[]} OmmItemのリスト
   */
  public static parseToOmmItems(text: string): OmmItem[] {
    const format = this.detectFormat(text);
    switch (format) {
      case "TLE":
        return this.parseTleFormat(text);
      case "JSON":
        return this.parseJsonFormat(text);
      case "XML":
        return this.parseXmlFormat(text);
      case "KVN":
        return this.parseKvnFormat(text);
      case "CSV":
        return this.parseCsvFormat(text);
      default:
        return [];
    }
  }

  /**
   * OmmItemをTLE文字列(TleStrings)に変換する
   * @param {OmmItem} item OmmItem
   * @returns {TleStrings} TLE文字列
   */
  public static ommItemToTleStrings(item: OmmItem): TleStrings {
    const noradId = (item.noradCatId ?? "").padStart(5, "0").slice(-5);
    const classification = (item.classificationType || "U").charAt(0);
    const designator = this.toTleDesignator(item.objectId);
    const epochDate = this.epochToDate(item.epoch);
    const epochStr = this.formatEpochUtc(epochDate);
    const ndotStr = this.formatSignedDecimal(item.meanMotionDot);
    const nddotStr = this.formatExpField(item.meanMotionDdot);
    const bstarStr = this.formatExpField(item.bstar);
    const ephemerisType = CommonUtil.toString(item.ephemerisType ?? 0).charAt(0) || "0";
    const elementSetNo = Math.abs(item.elementSetNo || 999)
      .toString()
      .padStart(4, " ")
      .slice(-4);

    let line1 =
      `1 ${noradId}${classification} ${designator} ${epochStr}` +
      ` ${ndotStr} ${nddotStr} ${bstarStr} ${ephemerisType} ${elementSetNo}`;
    line1 = line1 + TleUtil.calculateChecksum(line1);

    const inclination = item.inclination.toFixed(4).padStart(8, " ");
    const raan = item.raOfAscNode.toFixed(4).padStart(8, " ");
    const eccentricity = item.eccentricity.toFixed(7).substring(2).padStart(7, "0");
    const argPerigee = item.argOfPericenter.toFixed(4).padStart(8, " ");
    const meanAnomaly = item.meanAnomaly.toFixed(4).padStart(8, " ");
    const meanMotion = item.meanMotion.toFixed(8).padStart(11, " ");
    const revAtEpoch = Math.abs(item.revAtEpoch || 0)
      .toString()
      .padStart(5, "0")
      .slice(-5);

    let line2 =
      `2 ${noradId} ${inclination} ${raan} ${eccentricity} ${argPerigee} ${meanAnomaly} ${meanMotion}${revAtEpoch}`;
    line2 = line2 + TleUtil.calculateChecksum(line2);

    return {
      satelliteName: item.objectName || noradId,
      tleLine1: line1,
      tleLine2: line2,
    };
  }

  /**
   * OMM文字列(EPOCH)をDateに変換する
   * UTCとして扱う(タイムゾーン表記がない場合もUTCとみなす)
   */
  public static epochToDate(epochIso: string): Date {
    const match = (epochIso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
    if (!match) {
      return new Date(epochIso);
    }
    const [, y, mo, d, h, mi, s, frac] = match;
    const ms = frac ? Math.round(parseFloat(`0.${frac}`) * 1000) : 0;
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), ms));
  }

  /**
   * TLE形式のテキストをOmmItemのリストに変換する
   */
  private static parseTleFormat(text: string): OmmItem[] {
    const items: OmmItem[] = [];
    const lines = text.split(/\r\n|\r|\n/).filter((line) => !CommonUtil.isEmpty(line.trim()));

    let ii = 0;
    while (ii < lines.length - 1) {
      if (lines[ii].substring(0, 2) === "1 " && lines[ii + 1].substring(0, 2) === "2 ") {
        // 直前行が"1 "/"2 "で始まっていなければ衛星名行とみなす(2LEの場合は衛星名なし)
        const prevLine = ii > 0 ? lines[ii - 1] : "";
        const hasName =
          ii > 0 && prevLine.substring(0, 2) !== "1 " && prevLine.substring(0, 2) !== "2 ";
        const line0 = hasName ? prevLine : "";
        items.push(this.tleLinesToOmmItem(line0, lines[ii], lines[ii + 1]));
        ii += 2;
        continue;
      }
      ii++;
    }
    return items;
  }

  /**
   * TLEの0~2行目からOmmItemを生成する
   */
  private static tleLinesToOmmItem(line0: string, line1: string, line2: string): OmmItem {
    const item = new OmmItem();
    item.objectName = line0 ? TleUtil.getName(line0) : "";
    item.noradCatId = line1.substring(2, 7).trim();
    item.classificationType = line1.substring(7, 8).trim() || "U";
    item.objectId = line1.substring(9, 17).trim();

    const epochYear = parseInt(line1.substring(18, 20), 10);
    const epochDays = parseFloat(line1.substring(20, 32));
    item.epoch = this.tleEpochToDate(epochYear, epochDays).toISOString();

    item.meanMotionDot = parseFloat(line1.substring(33, 43));
    item.meanMotionDdot = this.parseExpField(line1.substring(44, 52));
    item.bstar = this.parseExpField(line1.substring(53, 61));
    item.ephemerisType = parseInt(line1.substring(62, 63), 10) || 0;
    item.elementSetNo = parseInt(line1.substring(64, 68), 10) || 0;

    item.inclination = parseFloat(line2.substring(8, 16));
    item.raOfAscNode = parseFloat(line2.substring(17, 25));
    item.eccentricity = parseFloat(`0.${line2.substring(26, 33).trim()}`);
    item.argOfPericenter = parseFloat(line2.substring(34, 42));
    item.meanAnomaly = parseFloat(line2.substring(43, 51));
    item.meanMotion = parseFloat(line2.substring(52, 63));
    item.revAtEpoch = parseInt(line2.substring(63, 68), 10) || 0;

    item.isInLatestOmm = true;
    return item;
  }

  /**
   * JSON/JSON-PRETTY形式のテキストをOmmItemのリストに変換する
   */
  private static parseJsonFormat(text: string): OmmItem[] {
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return [];
    }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.filter((o) => o && !CommonUtil.isEmpty(CommonUtil.toString(o.NORAD_CAT_ID))).map((o) => this.fieldsToOmmItem(o));
  }

  /**
   * CCSDS OMM XML形式のテキストをOmmItemのリストに変換する
   */
  private static parseXmlFormat(text: string): OmmItem[] {
    const segments = this.extractXmlBlocks(text, "segment");
    const blocks = segments.length > 0 ? segments : [text];
    const items: OmmItem[] = [];
    for (const block of blocks) {
      const fields: StringMap<string> = {
        OBJECT_NAME: this.extractXmlTag(block, "OBJECT_NAME"),
        OBJECT_ID: this.extractXmlTag(block, "OBJECT_ID"),
        NORAD_CAT_ID: this.extractXmlTag(block, "NORAD_CAT_ID"),
        EPOCH: this.extractXmlTag(block, "EPOCH"),
        MEAN_MOTION: this.extractXmlTag(block, "MEAN_MOTION"),
        ECCENTRICITY: this.extractXmlTag(block, "ECCENTRICITY"),
        INCLINATION: this.extractXmlTag(block, "INCLINATION"),
        RA_OF_ASC_NODE: this.extractXmlTag(block, "RA_OF_ASC_NODE"),
        ARG_OF_PERICENTER: this.extractXmlTag(block, "ARG_OF_PERICENTER"),
        MEAN_ANOMALY: this.extractXmlTag(block, "MEAN_ANOMALY"),
        EPHEMERIS_TYPE: this.extractXmlTag(block, "EPHEMERIS_TYPE"),
        CLASSIFICATION_TYPE: this.extractXmlTag(block, "CLASSIFICATION_TYPE"),
        ELEMENT_SET_NO: this.extractXmlTag(block, "ELEMENT_SET_NO"),
        REV_AT_EPOCH: this.extractXmlTag(block, "REV_AT_EPOCH"),
        BSTAR: this.extractXmlTag(block, "BSTAR"),
        MEAN_MOTION_DOT: this.extractXmlTag(block, "MEAN_MOTION_DOT"),
        MEAN_MOTION_DDOT: this.extractXmlTag(block, "MEAN_MOTION_DDOT"),
      };
      if (CommonUtil.isEmpty(fields.NORAD_CAT_ID)) continue;
      items.push(this.fieldsToOmmItem(fields));
    }
    return items;
  }

  /**
   * CCSDS OMM KVN形式のテキストをOmmItemのリストに変換する
   */
  private static parseKvnFormat(text: string): OmmItem[] {
    // "CCSDS_OMM_VERS"をレコードの区切りとして分割する(複数衛星分が連続する場合に対応)
    const records = text.split(/(?=^CCSDS_OMM_VERS\b)/m).filter((record) => !CommonUtil.isEmpty(record.trim()));
    const targets = records.length > 0 ? records : [text];

    const items: OmmItem[] = [];
    for (const record of targets) {
      const fields: StringMap<string> = {};
      record.split(/\r\n|\r|\n/).forEach((line) => {
        const idx = line.indexOf("=");
        if (idx < 0) return;
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (key) fields[key] = value;
      });
      if (CommonUtil.isEmpty(fields.NORAD_CAT_ID)) continue;
      items.push(this.fieldsToOmmItem(fields));
    }
    return items;
  }

  /**
   * CSV形式のテキストをOmmItemのリストに変換する
   */
  private static parseCsvFormat(text: string): OmmItem[] {
    const lines = text.split(/\r\n|\r|\n/).filter((line) => !CommonUtil.isEmpty(line.trim()));
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]).map((header) => header.trim());
    const items: OmmItem[] = [];
    for (let ii = 1; ii < lines.length; ii++) {
      const cols = this.splitCsvLine(lines[ii]);
      if (cols.length < headers.length) continue;

      const fields: StringMap<string> = {};
      headers.forEach((header, idx) => (fields[header] = cols[idx]));
      if (CommonUtil.isEmpty(fields.NORAD_CAT_ID)) continue;
      items.push(this.fieldsToOmmItem(fields));
    }
    return items;
  }

  /**
   * CSVの1行をフィールドの配列に分割する(ダブルクォート対応)
   */
  private static splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let ii = 0; ii < line.length; ii++) {
      const ch = line.charAt(ii);
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    result.push(current);
    return result;
  }

  /**
   * OMM標準キーワードのフィールドをOmmItemに変換する
   * JSON/KVN/CSVで共通のキーワード(OBJECT_NAME, NORAD_CAT_IDなど)を使用する
   */
  private static fieldsToOmmItem(fields: StringMap<any>): OmmItem {
    const item = new OmmItem();
    item.objectName = CommonUtil.toString(fields.OBJECT_NAME).trim();
    item.objectId = CommonUtil.toString(fields.OBJECT_ID).trim();
    item.noradCatId = CommonUtil.toString(fields.NORAD_CAT_ID).trim().padStart(5, "0");
    item.epoch = this.normalizeEpoch(CommonUtil.toString(fields.EPOCH));
    item.meanMotion = this.toNum(fields.MEAN_MOTION);
    item.eccentricity = this.toNum(fields.ECCENTRICITY);
    item.inclination = this.toNum(fields.INCLINATION);
    item.raOfAscNode = this.toNum(fields.RA_OF_ASC_NODE);
    item.argOfPericenter = this.toNum(fields.ARG_OF_PERICENTER);
    item.meanAnomaly = this.toNum(fields.MEAN_ANOMALY);
    item.ephemerisType = this.toNum(fields.EPHEMERIS_TYPE);
    item.classificationType = CommonUtil.toString(fields.CLASSIFICATION_TYPE).trim() || "U";
    item.elementSetNo = this.toNum(fields.ELEMENT_SET_NO) || 999;
    item.revAtEpoch = this.toNum(fields.REV_AT_EPOCH);
    item.bstar = this.toNum(fields.BSTAR);
    item.meanMotionDot = this.toNum(fields.MEAN_MOTION_DOT);
    item.meanMotionDdot = this.toNum(fields.MEAN_MOTION_DDOT);
    item.isInLatestOmm = true;
    return item;
  }

  /**
   * XMLテキストから指定タグの値を取得する
   */
  private static extractXmlTag(text: string, tagName: string): string {
    const match = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i"));
    return match ? match[1].trim() : "";
  }

  /**
   * XMLテキストから指定タグのブロックをすべて取得する
   */
  private static extractXmlBlocks(text: string, tagName: string): string[] {
    const blocks: string[] = [];
    const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      blocks.push(match[1]);
    }
    return blocks;
  }

  /**
   * 文字列または数値を数値に変換する
   */
  private static toNum(value: any): number {
    if (typeof value === "number") return value;
    if (value === undefined || value === null || value === "") return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  }

  /**
   * EPOCH文字列を正規化する
   * タイムゾーン表記がない場合はUTCとして扱う(末尾にZを付加する)
   */
  private static normalizeEpoch(epochStr: string): string {
    const trimmed = (epochStr ?? "").trim();
    if (CommonUtil.isEmpty(trimmed)) return "";
    if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return `${trimmed}Z`;
  }

  /**
   * TLEのEpoch(年/日)からDateに変換する(UTC)
   */
  private static tleEpochToDate(epochYear: number, epochDays: number): Date {
    const fullYear = 2000 + epochYear;
    const startOfYearMs = Date.UTC(fullYear, 0, 1, 0, 0, 0, 0);
    const elapsedMs = (epochDays - 1) * Constant.Time.MILLISECONDS_IN_DAY;
    return new Date(startOfYearMs + elapsedMs);
  }

  /**
   * DateをTLEのEpoch文字列(YYDDD.DDDDDDDD)に変換する(UTC)
   * memo: TleUtil.formatEpochはローカルタイムゾーンに依存するため、ここではUTCのみで計算する
   */
  private static formatEpochUtc(date: Date): string {
    const year = date.getUTCFullYear();
    const startOfYearMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
    const dayOfYear = Math.floor((date.getTime() - startOfYearMs) / Constant.Time.MILLISECONDS_IN_DAY) + 1;
    const startOfDayMs = Date.UTC(year, date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
    const fractionOfDay = (date.getTime() - startOfDayMs) / Constant.Time.MILLISECONDS_IN_DAY;

    const yy = year.toString().slice(-2);
    const ddd = dayOfYear.toString().padStart(3, "0");
    const frac = fractionOfDay.toFixed(8).slice(2);
    return `${yy}${ddd}.${frac}`;
  }

  /**
   * 符号付き小数(ndot形式、小数点明示)の文字列に変換する
   */
  private static formatSignedDecimal(value: number): string {
    const sign = value < 0 ? "-" : " ";
    const formatted = Math.abs(value).toFixed(8).substring(1); // "0.00013723" -> ".00013723"
    return `${sign}${formatted}`;
  }

  /**
   * 指数表記(小数点省略、符号付き指数)の8文字フィールドの文字列に変換する
   * (nddot, bstarで使用する notation: 値 = 符号 0.MMMMM * 10^指数)
   */
  private static formatExpField(value: number): string {
    if (!value) {
      return " 00000+0";
    }
    const sign = value < 0 ? "-" : " ";
    const abs = Math.abs(value);
    const exponent = Math.floor(Math.log10(abs)) + 1;
    const mantissa = abs / Math.pow(10, exponent);
    const mantissaDigits = Math.round(mantissa * 1e5)
      .toString()
      .padStart(5, "0");
    const expSign = exponent >= 0 ? "+" : "-";
    const expDigit = Math.abs(exponent).toString().slice(-1);
    return `${sign}${mantissaDigits}${expSign}${expDigit}`;
  }

  /**
   * 指数表記(小数点省略、符号付き指数)の8文字フィールドの文字列を数値に変換する
   */
  private static parseExpField(field: string): number {
    if (CommonUtil.isEmpty(field) || CommonUtil.isEmpty(field.trim())) return 0;
    const sign = field.charAt(0) === "-" ? -1 : 1;
    const mantissaDigits = field.substring(1, 6).trim();
    const expPart = field.substring(6, 8).trim();
    if (CommonUtil.isEmpty(mantissaDigits)) return 0;
    const mantissa = parseInt(mantissaDigits, 10) / 1e5;
    const exponent = parseInt(expPart, 10) || 0;
    return sign * mantissa * Math.pow(10, exponent);
  }

  /**
   * OBJECT_ID("1998-067A"形式)、またはTLEの国際識別符号をTLEの国際識別符号形式(8文字)に変換する
   */
  private static toTleDesignator(objectId: string): string {
    if (CommonUtil.isEmpty(objectId)) {
      return "00000A".padEnd(8, " ");
    }
    const match = objectId.match(/^(\d{4})-(\d{3})([A-Za-z]*)$/);
    if (match) {
      const yy = match[1].slice(2);
      const launchNo = match[2];
      const piece = match[3];
      return `${yy}${launchNo}${piece}`.padEnd(8, " ").substring(0, 8);
    }
    return objectId.padEnd(8, " ").substring(0, 8);
  }
}

export default OmmUtil;
