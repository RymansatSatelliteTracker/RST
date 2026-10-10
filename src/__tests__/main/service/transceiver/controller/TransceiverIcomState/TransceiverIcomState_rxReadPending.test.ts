import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.startRxReadPending / endRxReadPending", () => {
  it("startRxReadPendingで保留フラグが立ち、保留中の周波数要求と要求値が初期化されること", () => {
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

  it("startRxReadPending後に同じ値で再要求した場合も、重複判定でスキップされず更新フラグが立つこと", () => {
    const state = new TransceiverIcomState();
    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);
    state.startRxReadPending();

    state.setReqRxFreqHz(437800000);
    state.setReqTxFreqHz(145990000);

    expect(state.isReqRxFreqUpdate).toBe(true);
    expect(state.isReqTxFreqUpdate).toBe(true);
  });

  it("受信したTx周波数が前回と同一でRx取得フラグが立っていなくても、startRxReadPendingでRxの読み取りが予約されること", () => {
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

  it("endRxReadPendingで保留が解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.endRxReadPending();

    expect(state.isRxReadPending).toBe(false);
  });

  it("resetAllで保留が解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.resetAll();

    expect(state.isRxReadPending).toBe(false);
  });
});

describe("TransceiverIcomState.failRxRead", () => {
  it("上限回数に達するまでは保留を維持し、Rxの読み取りを再度予約すること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();
    state.isRecvRxFreqUpdate = false;

    const isGiveUp = state.failRxRead();

    expect(isGiveUp).toBe(false);
    expect(state.isRxReadPending).toBe(true);
    expect(state.isRecvRxFreqUpdate).toBe(true);
  });

  it("連続して上限回数（3回）失敗した場合は保留を解除し、trueを返すこと", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    expect(state.failRxRead()).toBe(false);
    expect(state.failRxRead()).toBe(false);
    expect(state.failRxRead()).toBe(true);

    expect(state.isRxReadPending).toBe(false);
  });

  it("保留を開始し直した場合は、失敗回数がリセットされること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();
    state.failRxRead();
    state.failRxRead();

    state.startRxReadPending();

    expect(state.failRxRead()).toBe(false);
    expect(state.failRxRead()).toBe(false);
    expect(state.isRxReadPending).toBe(true);
  });

  it("保留中でない場合は何もせず、falseを返すこと", () => {
    const state = new TransceiverIcomState();

    expect(state.failRxRead()).toBe(false);
    expect(state.isRecvRxFreqUpdate).toBe(false);
  });
});
