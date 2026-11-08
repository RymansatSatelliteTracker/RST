import Constant from "@/common/Constant.js";
import type { BeaconSavedState } from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBeaconMgr.js";
import TransceiverBeaconMgr from "@/renderer/components/organisms/TransceiverCtrl/managers/TransceiverBeaconMgr.js";
import { describe, expect, it } from "vitest";

const savedState: BeaconSavedState = {
  dopplerShiftMode: Constant.Transceiver.DopplerShiftMode.FIXED_RX,
  txFrequency: "0145.970.000",
  rxFrequency: "0435.633.000",
  rxOpeMode: "USB",
  plainTxBaseFreq: 145970000,
  plainRxBaseFreq: 435633000,
};

describe("TransceiverBeaconMgr", () => {
  it("未記録の場合、getSavedはnullを返すこと", () => {
    const mgr = new TransceiverBeaconMgr();
    expect(mgr.getSaved()).toBeNull();
    expect(mgr.getBeaconRxBaseFreq()).toBe(0);
  });

  it("記録した状態を取得できること（取得した値を変更しても記録は変わらないこと）", () => {
    const mgr = new TransceiverBeaconMgr();
    mgr.save(savedState);

    const saved = mgr.getSaved();
    expect(saved).toEqual(savedState);

    saved!.rxFrequency = "0000.000.000";
    expect(mgr.getSaved()).toEqual(savedState);
  });

  it("ビーコンのRx基準周波数を設定・取得できること", () => {
    const mgr = new TransceiverBeaconMgr();
    mgr.setBeaconRxBaseFreq(435610000);
    expect(mgr.getBeaconRxBaseFreq()).toBe(435610000);
  });

  it("ホイール操作の変化量を、通常のRx基準周波数と同じ向き（基準 - 変化量）で反映すること", () => {
    const mgr = new TransceiverBeaconMgr();
    mgr.setBeaconRxBaseFreq(435610000);

    mgr.shiftBeaconRxBaseFreq(-100);
    expect(mgr.getBeaconRxBaseFreq()).toBe(435610100);

    mgr.shiftBeaconRxBaseFreq(50);
    expect(mgr.getBeaconRxBaseFreq()).toBe(435610050);
  });

  it("clearで記録とビーコンのRx基準周波数を破棄すること", () => {
    const mgr = new TransceiverBeaconMgr();
    mgr.save(savedState);
    mgr.setBeaconRxBaseFreq(435610000);

    mgr.clear();

    expect(mgr.getSaved()).toBeNull();
    expect(mgr.getBeaconRxBaseFreq()).toBe(0);
  });
});
