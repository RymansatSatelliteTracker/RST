import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.startRxReadPending", () => {
  it("保留フラグが立ち、保留中の周波数要求と要求値が初期化されること", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);

    state.startRxReadPending();

    expect(state.isRxReadPending).toBe(true);
    expect(state.isReqRxFreqUpdate).toBe(false);
    expect(state.isReqTxFreqUpdate).toBe(false);
    expect(state.getReqRxFreqHz()).toBe(0);
    expect(state.getReqTxFreqHz()).toBe(0);
  });

  it("開始後に同じ値で再要求した場合も、重複判定でスキップされず更新フラグが立つこと", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);
    state.startRxReadPending();

    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);

    expect(state.isReqRxFreqUpdate).toBe(true);
    expect(state.isReqTxFreqUpdate).toBe(true);
  });

  it("受信したTx周波数が前回と同一でRx取得フラグが立っていなくても、Rxの読み取りが予約されること", () => {
    const state = new TransceiverIcomState();
    state.setRecvTxFreqHz(145992640);
    state.resetAll();
    // 同一値のため setRecvTxFreqHz ではRx取得フラグが立たない
    state.setRecvTxFreqHz(145992640);
    expect(state.isRecvRxFreqUpdate).toBe(false);

    state.startRxReadPending();

    expect(state.isRecvRxFreqUpdate).toBe(true);
    expect(state.isRxUpdate()).toBe(true);
  });
});
