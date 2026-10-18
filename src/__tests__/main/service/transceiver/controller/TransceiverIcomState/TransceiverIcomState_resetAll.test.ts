import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.resetAll", () => {
  it("Rx読み取り待ちが解除されること", () => {
    const state = new TransceiverIcomState();
    state.startRxReadPending();

    state.resetAll();

    expect(state.isRxReadPending).toBe(false);
  });
});
