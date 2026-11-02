import TransceiverYaesuState from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuState.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TransceiverYaesuState.setReqRxFreqHz / setReqTxFreqHz", () => {
  it("現在保持している値と異なる場合、値を更新し、更新フラグを立てること", () => {
    const state = new TransceiverYaesuState();

    state.setReqRxFreqHz(435100000);
    state.setReqTxFreqHz(145900000);

    expect(state.getReqRxFreqHz()).toBe(435100000);
    expect(state.getReqTxFreqHz()).toBe(145900000);
    expect(state.isReqRxFreqUpdate).toBe(true);
    expect(state.isReqTxFreqUpdate).toBe(true);
  });

  it("現在保持している値と同一の場合、更新フラグを立てないこと", () => {
    const state = new TransceiverYaesuState();
    state.setReqRxFreqHz(435100000);
    state.setReqTxFreqHz(145900000);
    state.isReqRxFreqUpdate = false;
    state.isReqTxFreqUpdate = false;

    state.setReqRxFreqHz(435100000);
    state.setReqTxFreqHz(145900000);

    expect(state.isReqRxFreqUpdate).toBe(false);
    expect(state.isReqTxFreqUpdate).toBe(false);
  });

  it("isForceにtrueを指定した場合、値が同一でも更新フラグを立てること", () => {
    const state = new TransceiverYaesuState();
    state.setReqRxFreqHz(435100000);
    state.setReqTxFreqHz(145900000);
    state.isReqRxFreqUpdate = false;
    state.isReqTxFreqUpdate = false;

    state.setReqRxFreqHz(435100000, true);
    state.setReqTxFreqHz(145900000, true);

    expect(state.isReqRxFreqUpdate).toBe(true);
    expect(state.isReqTxFreqUpdate).toBe(true);
  });

  it("Rx側の設定は、Tx側に影響しないこと", () => {
    const state = new TransceiverYaesuState();

    state.setReqRxFreqHz(435100000);

    expect(state.getReqTxFreqHz()).toBe(0);
    expect(state.isReqTxFreqUpdate).toBe(false);
  });
});

describe("TransceiverYaesuState.setReqRxMode / setReqTxMode", () => {
  it("現在保持している値と異なる場合、要求値と現在値を更新し、更新フラグを立てること", () => {
    const state = new TransceiverYaesuState();

    state.setReqRxMode("USB");
    state.setReqTxMode("FM");

    expect(state.getReqRxMode()).toBe("USB");
    expect(state.getReqTxMode()).toBe("FM");
    expect(state.currentRxMode).toBe("USB");
    expect(state.currentTxMode).toBe("FM");
    expect(state.isReqRxModeUpdate).toBe(true);
    expect(state.isReqTxModeUpdate).toBe(true);
  });

  it("運用モードがnullまたは空の場合は、何もしないこと", () => {
    const state = new TransceiverYaesuState();

    state.setReqRxMode(null);
    state.setReqRxMode("");
    state.setReqTxMode(null);
    state.setReqTxMode("");

    expect(state.getReqRxMode()).toBe("");
    expect(state.getReqTxMode()).toBe("");
    expect(state.isReqRxModeUpdate).toBe(false);
    expect(state.isReqTxModeUpdate).toBe(false);
  });

  it("同一の運用モードの場合、更新フラグを立てないこと", () => {
    const state = new TransceiverYaesuState();
    state.setReqRxMode("USB");
    state.setReqTxMode("FM");
    state.isReqRxModeUpdate = false;
    state.isReqTxModeUpdate = false;

    state.setReqRxMode("USB");
    state.setReqTxMode("FM");

    expect(state.isReqRxModeUpdate).toBe(false);
    expect(state.isReqTxModeUpdate).toBe(false);
  });

  it("isForceにtrueを指定した場合、同一の運用モードでも更新フラグを立てること", () => {
    const state = new TransceiverYaesuState();
    state.setReqRxMode("USB");
    state.setReqTxMode("FM");
    state.isReqRxModeUpdate = false;
    state.isReqTxModeUpdate = false;

    state.setReqRxMode("USB", true);
    state.setReqTxMode("FM", true);

    expect(state.isReqRxModeUpdate).toBe(true);
    expect(state.isReqTxModeUpdate).toBe(true);
  });
});

describe("TransceiverYaesuState.isRxUpdate / isTxUpdate", () => {
  it("初期状態では、どちらもfalseを返すこと", () => {
    const state = new TransceiverYaesuState();

    expect(state.isRxUpdate()).toBe(false);
    expect(state.isTxUpdate()).toBe(false);
  });

  it.each(["isReqRxFreqUpdate", "isReqRxModeUpdate"] as const)("%sがtrueの場合、isRxUpdateがtrueを返すこと", (flag) => {
    const state = new TransceiverYaesuState();
    state[flag] = true;

    expect(state.isRxUpdate()).toBe(true);
    expect(state.isTxUpdate()).toBe(false);
  });

  it.each(["isReqTxFreqUpdate", "isReqTxModeUpdate"] as const)("%sがtrueの場合、isTxUpdateがtrueを返すこと", (flag) => {
    const state = new TransceiverYaesuState();
    state[flag] = true;

    expect(state.isTxUpdate()).toBe(true);
    expect(state.isRxUpdate()).toBe(false);
  });
});

describe("TransceiverYaesuState Tx周波数の送信間引き", () => {
  it("前回送信値が未設定の場合は、送信が必要と判定すること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);

    expect(state.shouldSendTxFreq(500)).toBe(true);
  });

  it("前回送信値との差が閾値未満の場合は、送信不要と判定すること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.setReqTxFreqHz(145900499);

    expect(state.shouldSendTxFreq(500)).toBe(false);
  });

  it("前回送信値との差が閾値以上の場合は、送信が必要と判定すること（上下どちらの方向も）", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.setReqTxFreqHz(145900500);
    expect(state.shouldSendTxFreq(500)).toBe(true);

    state.setReqTxFreqHz(145899500);
    expect(state.shouldSendTxFreq(500)).toBe(true);
  });

  it("閾値が0の場合は、前回送信値と異なれば送信が必要と判定すること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.setReqTxFreqHz(145900001);

    expect(state.shouldSendTxFreq(0)).toBe(true);
  });

  it("isForceで要求された場合は、差が閾値未満でも、送信が必要と判定し、送信後は強制が解除されること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.setReqTxFreqHz(145900100, true);
    expect(state.shouldSendTxFreq(500)).toBe(true);

    state.markTxFreqSent(145900100);
    state.setReqTxFreqHz(145900200);
    expect(state.shouldSendTxFreq(500)).toBe(false);
  });

  it("Txの運用モードが変更された場合は、差が閾値未満でも、送信が必要と判定すること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.setReqTxMode("FM");
    state.setReqTxFreqHz(145900100);

    expect(state.shouldSendTxFreq(500)).toBe(true);
  });

  it("resetLastSentTxFreqHzの後は、送信が必要と判定すること", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);

    state.resetLastSentTxFreqHz();

    expect(state.shouldSendTxFreq(500)).toBe(true);
  });

  it("markTxFreqSentで、送信した値を記録し、更新フラグを下ろすこと", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);

    state.markTxFreqSent(145900000);

    expect(state.getLastSentTxFreqHz()).toBe(145900000);
    expect(state.isReqTxFreqUpdate).toBe(false);
  });

  it("skipTxFreqで、送信せずに更新フラグを下ろすこと（送信した値は更新しない）", () => {
    const state = new TransceiverYaesuState();
    state.setReqTxFreqHz(145900000);
    state.markTxFreqSent(145900000);
    state.setReqTxFreqHz(145900100);

    state.skipTxFreq();

    expect(state.isReqTxFreqUpdate).toBe(false);
    expect(state.getLastSentTxFreqHz()).toBe(145900000);
  });
});

describe("TransceiverYaesuState RSTが送信した値の自動通知の除外判定", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("送信直後は、同一の周波数、運用モードを、除外対象と判定すること", () => {
    const state = new TransceiverYaesuState();

    state.markRxSent(435100000, "USB");

    expect(state.isEchoOfSentRxFreq(435100000)).toBe(true);
    expect(state.isEchoOfSentRxMode("USB")).toBe(true);
  });

  it("送信した値と異なる周波数、運用モードは、除外対象と判定しないこと", () => {
    const state = new TransceiverYaesuState();
    state.markRxSent(435100000, "USB");

    expect(state.isEchoOfSentRxFreq(435100001)).toBe(false);
    expect(state.isEchoOfSentRxMode("FM")).toBe(false);
  });

  it("500ms経過後は、除外対象と判定しないこと", () => {
    const state = new TransceiverYaesuState();
    state.markRxSent(435100000, "USB");

    vi.advanceTimersByTime(499);
    expect(state.isEchoOfSentRxFreq(435100000)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(state.isEchoOfSentRxFreq(435100000)).toBe(false);
    expect(state.isEchoOfSentRxMode("USB")).toBe(false);
  });

  it("周波数のみ、運用モードのみを記録した場合は、もう一方の値を更新しないこと", () => {
    const state = new TransceiverYaesuState();
    state.markRxSent(435100000, null);
    state.markRxSent(null, "FM");

    expect(state.isEchoOfSentRxFreq(435100000)).toBe(true);
    expect(state.isEchoOfSentRxMode("FM")).toBe(true);
  });
});

describe("TransceiverYaesuState.resetAll", () => {
  it("全ての値と更新フラグを、初期状態に戻すこと", () => {
    const state = new TransceiverYaesuState();
    state.isSatelliteMode = true;
    state.setReqRxFreqHz(435100000);
    state.setReqTxFreqHz(145900000);
    state.setReqRxMode("USB");
    state.setReqTxMode("FM");
    state.setRecvRxFreqHz(435100000);
    state.markTxFreqSent(145900000);

    state.resetAll();

    expect(state.isSatelliteMode).toBe(false);
    expect(state.getReqRxFreqHz()).toBe(0);
    expect(state.getReqTxFreqHz()).toBe(0);
    expect(state.getReqRxMode()).toBe("");
    expect(state.getReqTxMode()).toBe("");
    expect(state.getRecvRxFreqHz()).toBe(0);
    expect(state.getLastSentTxFreqHz()).toBe(0);
    expect(state.currentRxMode).toBe("");
    expect(state.currentTxMode).toBe("");
    expect(state.isRxUpdate()).toBe(false);
    expect(state.isTxUpdate()).toBe(false);
  });
});
