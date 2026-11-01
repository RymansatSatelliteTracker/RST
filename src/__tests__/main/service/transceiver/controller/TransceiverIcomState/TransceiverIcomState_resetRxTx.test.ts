import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.resetRx", () => {
  it("Rx側の更新フラグをすべて下ろすこと", () => {
    const state = new TransceiverIcomState();
    state.isReqRxFreqUpdate = true;
    state.isReqRxModeUpdate = true;
    state.isRecvRxFreqUpdate = true;

    state.resetRx();

    expect(state.isRxUpdate()).toBe(false);
  });

  it("Rxの要求モードは保持されたままであること（Txとの非対称な現状の挙動）", () => {
    const state = new TransceiverIcomState();
    state.setReqRxMode("01", "00");

    state.resetRx();

    expect(state.getReqRxMode()).toBe("01");
  });

  it("Tx側のフラグには影響しないこと", () => {
    const state = new TransceiverIcomState();
    state.isReqTxFreqUpdate = true;

    state.resetRx();

    expect(state.isReqTxFreqUpdate).toBe(true);
  });
});

describe("TransceiverIcomState.resetTx", () => {
  it("Tx側の更新フラグをすべて下ろすこと", () => {
    const state = new TransceiverIcomState();
    state.isReqTxFreqUpdate = true;
    state.isReqTxModeUpdate = true;
    state.isRecvTxFreqUpdate = true;

    state.resetTx();

    expect(state.isTxUpdate()).toBe(false);
  });

  it("Txの要求モードを空に戻すこと", () => {
    const state = new TransceiverIcomState();
    state.setReqTxMode("05", "00");

    state.resetTx();

    expect(state.getReqTxMode()).toBe("");
  });

  it("Rx側のフラグには影響しないこと", () => {
    const state = new TransceiverIcomState();
    state.isReqRxFreqUpdate = true;

    state.resetTx();

    expect(state.isReqRxFreqUpdate).toBe(true);
  });
});
