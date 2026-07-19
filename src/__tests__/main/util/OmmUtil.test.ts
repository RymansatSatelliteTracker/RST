import { OmmItem } from "@/common/model/OmmModel.js";
import OmmUtil from "@/main/util/OmmUtil.js";

// 以下のテストデータは、celestrak.org の gp.php (CATNR=25544) から
// 同一エポックで取得した実際のレスポンス(2026-06-20T09:57:02.757600 UTC時点のISS)
const ISS_TLE_LINE0 = "ISS (ZARYA)";
const ISS_TLE_LINE1 = "1 25544U 98067A   26171.41461525  .00008813  00000+0  16600-3 0  9990";
const ISS_TLE_LINE2 = "2 25544  51.6327 284.1189 0004557 208.5194 151.5545 15.49333088572250";
const ISS_TLE_TEXT = `${ISS_TLE_LINE0}\n${ISS_TLE_LINE1}\n${ISS_TLE_LINE2}`;

const ISS_XML_TEXT = `<?xml version="1.0" encoding="UTF-8"?>
<ndm xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://sanaregistry.org/r/ndmxml_unqualified/ndmxml-2.0.0-master-2.0.xsd">
  <omm id="CCSDS_OMM_VERS" version="2.0">
    <header>
      <CREATION_DATE/>
      <ORIGINATOR/>
    </header>
    <body>
      <segment>
        <metadata>
          <OBJECT_NAME>ISS (ZARYA)</OBJECT_NAME>
          <OBJECT_ID>1998-067A</OBJECT_ID>
          <CENTER_NAME>EARTH</CENTER_NAME>
          <REF_FRAME>TEME</REF_FRAME>
          <TIME_SYSTEM>UTC</TIME_SYSTEM>
          <MEAN_ELEMENT_THEORY>SGP4</MEAN_ELEMENT_THEORY>
        </metadata>
        <data>
          <meanElements>
            <EPOCH>2026-06-20T09:57:02.757600</EPOCH>
            <MEAN_MOTION>15.49333088</MEAN_MOTION>
            <ECCENTRICITY>.0004557</ECCENTRICITY>
            <INCLINATION>51.6327</INCLINATION>
            <RA_OF_ASC_NODE>284.1189</RA_OF_ASC_NODE>
            <ARG_OF_PERICENTER>208.5194</ARG_OF_PERICENTER>
            <MEAN_ANOMALY>151.5545</MEAN_ANOMALY>
          </meanElements>
          <tleParameters>
            <EPHEMERIS_TYPE>0</EPHEMERIS_TYPE>
            <CLASSIFICATION_TYPE>U</CLASSIFICATION_TYPE>
            <NORAD_CAT_ID>25544</NORAD_CAT_ID>
            <ELEMENT_SET_NO>999</ELEMENT_SET_NO>
            <REV_AT_EPOCH>57225</REV_AT_EPOCH>
            <BSTAR>.166E-3</BSTAR>
            <MEAN_MOTION_DOT>.8813E-4</MEAN_MOTION_DOT>
            <MEAN_MOTION_DDOT>0</MEAN_MOTION_DDOT>
          </tleParameters>
        </data>
      </segment>
    </body>
  </omm>
</ndm>`;

const ISS_KVN_TEXT = `CCSDS_OMM_VERS = 2.0
CREATION_DATE  =
ORIGINATOR     =

OBJECT_NAME    = ISS (ZARYA)
OBJECT_ID      = 1998-067A
CENTER_NAME    = EARTH
REF_FRAME      = TEME
TIME_SYSTEM    = UTC
MEAN_ELEMENT_THEORY = SGP/SGP4

EPOCH          = 2026-06-20T09:57:02.757600
MEAN_MOTION    = 15.49333088
ECCENTRICITY   = .0004557
INCLINATION    = 51.6327
RA_OF_ASC_NODE = 284.1189
ARG_OF_PERICENTER = 208.5194
MEAN_ANOMALY   = 151.5545

EPHEMERIS_TYPE = 0
CLASSIFICATION_TYPE = U
NORAD_CAT_ID   = 25544
ELEMENT_SET_NO = 999
REV_AT_EPOCH   = 57225
BSTAR          = .166E-3
MEAN_MOTION_DOT = .8813E-4
MEAN_MOTION_DDOT = 0`;

const ISS_JSON_TEXT =
  '[{"OBJECT_NAME":"ISS (ZARYA)","OBJECT_ID":"1998-067A","EPOCH":"2026-06-20T09:57:02.757600",' +
  '"MEAN_MOTION":15.49333088,"ECCENTRICITY":0.0004557,"INCLINATION":51.6327,"RA_OF_ASC_NODE":284.1189,' +
  '"ARG_OF_PERICENTER":208.5194,"MEAN_ANOMALY":151.5545,"EPHEMERIS_TYPE":0,"CLASSIFICATION_TYPE":"U",' +
  '"NORAD_CAT_ID":25544,"ELEMENT_SET_NO":999,"REV_AT_EPOCH":57225,"BSTAR":0.000166,' +
  '"MEAN_MOTION_DOT":8.813e-5,"MEAN_MOTION_DDOT":0}]';

const ISS_CSV_TEXT = `OBJECT_NAME,OBJECT_ID,EPOCH,MEAN_MOTION,ECCENTRICITY,INCLINATION,RA_OF_ASC_NODE,ARG_OF_PERICENTER,MEAN_ANOMALY,EPHEMERIS_TYPE,CLASSIFICATION_TYPE,NORAD_CAT_ID,ELEMENT_SET_NO,REV_AT_EPOCH,BSTAR,MEAN_MOTION_DOT,MEAN_MOTION_DDOT
ISS (ZARYA),1998-067A,2026-06-20T09:57:02.757600,15.49333088,.0004557,51.6327,284.1189,208.5194,151.5545,0,U,25544,999,57225,.166E-3,.8813E-4,0`;

/**
 * [正常系] 形式自動判別
 */
describe("[正常系]detectFormatで形式を判別できる", () => {
  it("TLE(3LE)形式を判別できる", () => {
    expect(OmmUtil.detectFormat(ISS_TLE_TEXT)).toBe("TLE");
  });

  it("2LE形式(衛星名なし)を判別できる", () => {
    const text = `${ISS_TLE_LINE1}\n${ISS_TLE_LINE2}`;
    expect(OmmUtil.detectFormat(text)).toBe("TLE");
  });

  it("XML形式を判別できる", () => {
    expect(OmmUtil.detectFormat(ISS_XML_TEXT)).toBe("XML");
  });

  it("KVN形式を判別できる", () => {
    expect(OmmUtil.detectFormat(ISS_KVN_TEXT)).toBe("KVN");
  });

  it("JSON形式を判別できる", () => {
    expect(OmmUtil.detectFormat(ISS_JSON_TEXT)).toBe("JSON");
  });

  it("JSON-PRETTY形式を判別できる", () => {
    const pretty = JSON.stringify(JSON.parse(ISS_JSON_TEXT), null, 2);
    expect(OmmUtil.detectFormat(pretty)).toBe("JSON");
  });

  it("CSV形式を判別できる", () => {
    expect(OmmUtil.detectFormat(ISS_CSV_TEXT)).toBe("CSV");
  });

  it("不明な形式はUNKNOWNを返す", () => {
    expect(OmmUtil.detectFormat("hoge fuga")).toBe("UNKNOWN");
  });

  it("空文字はUNKNOWNを返す", () => {
    expect(OmmUtil.detectFormat("")).toBe("UNKNOWN");
  });
});

/**
 * 各形式から変換したOmmItemの期待値
 */
function expectIssOmmItem(item: OmmItem) {
  expect(item.objectName).toBe("ISS (ZARYA)");
  expect(item.noradCatId).toBe("25544");
  expect(item.meanMotion).toBeCloseTo(15.49333088, 8);
  expect(item.eccentricity).toBeCloseTo(0.0004557, 7);
  expect(item.inclination).toBeCloseTo(51.6327, 4);
  expect(item.raOfAscNode).toBeCloseTo(284.1189, 4);
  expect(item.argOfPericenter).toBeCloseTo(208.5194, 4);
  expect(item.meanAnomaly).toBeCloseTo(151.5545, 4);
  expect(item.ephemerisType).toBe(0);
  expect(item.classificationType).toBe("U");
  expect(item.elementSetNo).toBe(999);
  expect(item.revAtEpoch).toBe(57225);
  expect(item.bstar).toBeCloseTo(0.000166, 8);
  expect(item.meanMotionDot).toBeCloseTo(0.00008813, 8);
  expect(item.meanMotionDdot).toBe(0);
}

/**
 * [正常系] 各形式 -> OmmItem への変換
 */
describe("[正常系]parseToOmmItemsで各形式からOmmItemに変換できる", () => {
  it("TLE(3LE)形式からOmmItemに変換できる", () => {
    const items = OmmUtil.parseToOmmItems(ISS_TLE_TEXT);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
    expect(items[0].objectId).toBe("98067A");
  });

  it("2LE形式(衛星名なし)からOmmItemに変換できる(衛星名はnoradCatId)", () => {
    const text = `${ISS_TLE_LINE1}\n${ISS_TLE_LINE2}`;
    const items = OmmUtil.parseToOmmItems(text);
    expect(items.length).toBe(1);
    expect(items[0].noradCatId).toBe("25544");
    expect(items[0].objectName).toBe("25544");
  });

  it("TLEの2桁年が57以上の場合は1900年代として解釈できる", () => {
    const line1 = "1 25544U 98067A   57123.50000000  .00008813  00000+0  16600-3 0  9990";
    const text = `${line1}\n${ISS_TLE_LINE2}`;
    const items = OmmUtil.parseToOmmItems(text);

    expect(items.length).toBe(1);
    expect(items[0].epoch).toBe("1957-05-03T12:00:00.000Z");
  });

  it("TLEの2桁年が56以下の場合は2000年代として解釈できる", () => {
    const line1 = "1 25544U 98067A   56001.00000000  .00008813  00000+0  16600-3 0  9990";
    const text = `${line1}\n${ISS_TLE_LINE2}`;
    const items = OmmUtil.parseToOmmItems(text);

    expect(items.length).toBe(1);
    expect(items[0].epoch).toBe("2056-01-01T00:00:00.000Z");
  });

  it("複数衛星分のTLEからOmmItemのリストに変換できる", () => {
    const text = `${ISS_TLE_TEXT}\n${ISS_TLE_LINE0}\n${ISS_TLE_LINE1}\n${ISS_TLE_LINE2}`;
    const items = OmmUtil.parseToOmmItems(text);
    expect(items.length).toBe(2);
  });

  it("XML形式からOmmItemに変換できる", () => {
    const items = OmmUtil.parseToOmmItems(ISS_XML_TEXT);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
    expect(items[0].objectId).toBe("1998-067A");
  });

  it("XML形式のOBJECT_NAMEにXMLエスケープが含まれる場合、アンエスケープしてOmmItemに変換できる", () => {
    const text = ISS_XML_TEXT.replace(
      "<OBJECT_NAME>ISS (ZARYA)</OBJECT_NAME>",
      "<OBJECT_NAME>AMSAT &amp; ISS</OBJECT_NAME>"
    );
    const items = OmmUtil.parseToOmmItems(text);
    expect(items.length).toBe(1);
    expect(items[0].objectName).toBe("AMSAT & ISS");
  });

  it("KVN形式からOmmItemに変換できる", () => {
    const items = OmmUtil.parseToOmmItems(ISS_KVN_TEXT);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
  });

  it("複数衛星分のKVNからOmmItemのリストに変換できる", () => {
    const text = `${ISS_KVN_TEXT}\n\n${ISS_KVN_TEXT}`;
    const items = OmmUtil.parseToOmmItems(text);
    expect(items.length).toBe(2);
  });

  it("JSON形式からOmmItemに変換できる", () => {
    const items = OmmUtil.parseToOmmItems(ISS_JSON_TEXT);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
  });

  it("JSON-PRETTY形式からOmmItemに変換できる", () => {
    const pretty = JSON.stringify(JSON.parse(ISS_JSON_TEXT), null, 2);
    const items = OmmUtil.parseToOmmItems(pretty);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
  });

  it("CSV形式からOmmItemに変換できる", () => {
    const items = OmmUtil.parseToOmmItems(ISS_CSV_TEXT);
    expect(items.length).toBe(1);
    expectIssOmmItem(items[0]);
  });

  it("不明な形式の場合は空配列を返す", () => {
    expect(OmmUtil.parseToOmmItems("hoge fuga")).toEqual([]);
  });
});

/**
 * [正常系] epochToDate
 */
describe("[正常系]epochToDateでOMMのEPOCH文字列をDateに変換できる", () => {
  it("マイクロ秒精度のEPOCH文字列をUTCのDateに変換できる", () => {
    const date = OmmUtil.epochToDate("2026-06-20T09:57:02.757600Z");
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(5); // 0-indexed: 6月
    expect(date.getUTCDate()).toBe(20);
    expect(date.getUTCHours()).toBe(9);
    expect(date.getUTCMinutes()).toBe(57);
    expect(date.getUTCSeconds()).toBe(2);
  });
});
