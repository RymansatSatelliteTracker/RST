import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

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

  it("上限に達して諦めた場合は、Rxの読み取りの予約も残さないこと", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();
    state.failRxRead();
    state.failRxRead();

    state.failRxRead();

    expect(state.isRecvRxFreqUpdate).toBe(false);
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
