import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.setRecvRxFreqHz", () => {
  it("現在保持している値と異なる場合、値を更新し、Rx・Tx両方の取得フラグを立てること", () => {
    const state = new TransceiverIcomState();

    state.setRecvRxFreqHz(435000000);

    expect(state.getRecvRxFreqHz()).toBe(435000000);
    expect(state.isRecvRxFreqUpdate).toBe(true);
    // 無線機での変更は片側のみ通知されるため、反対側も取得対象とする
    expect(state.isRecvTxFreqUpdate).toBe(true);
  });

  it("現在保持している値と同一の場合、フラグを立てないこと", () => {
    const state = new TransceiverIcomState();
    state.setRecvRxFreqHz(435000000);
    state.isRecvRxFreqUpdate = false;
    state.isRecvTxFreqUpdate = false;

    state.setRecvRxFreqHz(435000000);

    expect(state.isRecvRxFreqUpdate).toBe(false);
    expect(state.isRecvTxFreqUpdate).toBe(false);
  });

  it("Tx側の取得値は変更しないこと", () => {
    const state = new TransceiverIcomState();

    state.setRecvRxFreqHz(435000000);

    expect(state.getRecvTxFreqHz()).toBe(0);
  });
});

describe("TransceiverIcomState.setRecvTxFreqHz", () => {
  it("現在保持している値と異なる場合、値を更新し、Tx・Rx両方の取得フラグを立てること", () => {
    const state = new TransceiverIcomState();

    state.setRecvTxFreqHz(145900000);

    expect(state.getRecvTxFreqHz()).toBe(145900000);
    expect(state.isRecvTxFreqUpdate).toBe(true);
    expect(state.isRecvRxFreqUpdate).toBe(true);
  });

  it("現在保持している値と同一の場合、フラグを立てないこと", () => {
    const state = new TransceiverIcomState();
    state.setRecvTxFreqHz(145900000);
    state.isRecvRxFreqUpdate = false;
    state.isRecvTxFreqUpdate = false;

    state.setRecvTxFreqHz(145900000);

    expect(state.isRecvRxFreqUpdate).toBe(false);
    expect(state.isRecvTxFreqUpdate).toBe(false);
  });

  it("Rx側の取得値は変更しないこと", () => {
    const state = new TransceiverIcomState();

    state.setRecvTxFreqHz(145900000);

    expect(state.getRecvRxFreqHz()).toBe(0);
  });
});
