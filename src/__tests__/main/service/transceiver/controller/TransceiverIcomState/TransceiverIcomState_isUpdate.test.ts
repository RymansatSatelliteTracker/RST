import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.isRxUpdate", () => {
  it("初期状態ではfalseを返すこと", () => {
    expect(new TransceiverIcomState().isRxUpdate()).toBe(false);
  });

  it.each(["isReqRxFreqUpdate", "isReqRxModeUpdate", "isRecvRxFreqUpdate"] as const)(
    "%sがtrueの場合はtrueを返すこと",
    (flag) => {
      const state = new TransceiverIcomState();
      state[flag] = true;
      expect(state.isRxUpdate()).toBe(true);
    }
  );

  it("Tx側のフラグのみがtrueの場合はfalseを返すこと", () => {
    const state = new TransceiverIcomState();
    state.isReqTxFreqUpdate = true;
    state.isReqTxModeUpdate = true;
    state.isRecvTxFreqUpdate = true;
    expect(state.isRxUpdate()).toBe(false);
  });
});

describe("TransceiverIcomState.isTxUpdate", () => {
  it("初期状態ではfalseを返すこと", () => {
    expect(new TransceiverIcomState().isTxUpdate()).toBe(false);
  });

  it.each(["isReqTxFreqUpdate", "isReqTxModeUpdate", "isRecvTxFreqUpdate"] as const)(
    "%sがtrueの場合はtrueを返すこと",
    (flag) => {
      const state = new TransceiverIcomState();
      state[flag] = true;
      expect(state.isTxUpdate()).toBe(true);
    }
  );

  it("Rx側のフラグのみがtrueの場合はfalseを返すこと", () => {
    const state = new TransceiverIcomState();
    state.isReqRxFreqUpdate = true;
    state.isReqRxModeUpdate = true;
    state.isRecvRxFreqUpdate = true;
    expect(state.isTxUpdate()).toBe(false);
  });
});
