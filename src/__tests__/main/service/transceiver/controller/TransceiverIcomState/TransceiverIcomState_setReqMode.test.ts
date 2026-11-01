import TransceiverIcomState from "@/main/service/transceiver/controller/TransceiverIcomState.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomState.setReqRxMode", () => {
  it("現在保持している値と異なる場合、要求値と現在値を更新し、更新フラグを立てること", () => {
    const state = new TransceiverIcomState();

    state.setReqRxMode("01", "01");

    expect(state.getReqRxMode()).toBe("01");
    expect(state.getReqRxDataMode()).toBe("01");
    expect(state.currentRxOpeMode).toBe("01");
    expect(state.currentRxDataMode).toBe("01");
    expect(state.isReqRxModeUpdate).toBe(true);
  });

  it("運用モードがnullまたは空の場合は何もしないこと", () => {
    const state = new TransceiverIcomState();

    state.setReqRxMode(null, "01");
    state.setReqRxMode("", "01");

    expect(state.getReqRxMode()).toBe("");
    expect(state.isReqRxModeUpdate).toBe(false);
  });

  it("運用モード・データモードとも同一の場合、更新フラグを立てないこと", () => {
    const state = new TransceiverIcomState();
    state.setReqRxMode("05", "00");
    state.isReqRxModeUpdate = false;

    state.setReqRxMode("05", "00");

    expect(state.isReqRxModeUpdate).toBe(false);
  });

  it("データモードのみ異なる場合、更新フラグを立てること", () => {
    const state = new TransceiverIcomState();
    state.setReqRxMode("05", "00");
    state.isReqRxModeUpdate = false;

    state.setReqRxMode("05", "01");

    expect(state.getReqRxDataMode()).toBe("01");
    expect(state.isReqRxModeUpdate).toBe(true);
  });

  it("isForceにtrueを指定した場合、値が同一でも更新フラグを立てること", () => {
    const state = new TransceiverIcomState();
    state.setReqRxMode("05", "00");
    state.isReqRxModeUpdate = false;

    state.setReqRxMode("05", "00", true);

    expect(state.isReqRxModeUpdate).toBe(true);
  });

  it("Tx側の値・フラグには影響しないこと", () => {
    const state = new TransceiverIcomState();

    state.setReqRxMode("01", "01");

    expect(state.getReqTxMode()).toBe("");
    expect(state.currentTxOpeMode).toBe("");
    expect(state.isReqTxModeUpdate).toBe(false);
  });
});

describe("TransceiverIcomState.setReqTxMode", () => {
  it("現在保持している値と異なる場合、要求値と現在値を更新し、更新フラグを立てること", () => {
    const state = new TransceiverIcomState();

    state.setReqTxMode("00", "01");

    expect(state.getReqTxMode()).toBe("00");
    expect(state.getReqTxDataMode()).toBe("01");
    expect(state.currentTxOpeMode).toBe("00");
    expect(state.currentTxDataMode).toBe("01");
    expect(state.isReqTxModeUpdate).toBe(true);
  });

  it("運用モードがnullまたは空の場合は何もしないこと", () => {
    const state = new TransceiverIcomState();

    state.setReqTxMode(null, "00");
    state.setReqTxMode("", "00");

    expect(state.getReqTxMode()).toBe("");
    expect(state.isReqTxModeUpdate).toBe(false);
  });

  it("運用モード・データモードとも同一の場合、更新フラグを立てないこと", () => {
    const state = new TransceiverIcomState();
    state.setReqTxMode("05", "00");
    state.isReqTxModeUpdate = false;

    state.setReqTxMode("05", "00");

    expect(state.isReqTxModeUpdate).toBe(false);
  });

  it("isForceにtrueを指定した場合、値が同一でも更新フラグを立てること", () => {
    const state = new TransceiverIcomState();
    state.setReqTxMode("05", "00");
    state.isReqTxModeUpdate = false;

    state.setReqTxMode("05", "00", true);

    expect(state.isReqTxModeUpdate).toBe(true);
  });

  it("Rx側の値・フラグには影響しないこと", () => {
    const state = new TransceiverIcomState();

    state.setReqTxMode("00", "01");

    expect(state.getReqRxMode()).toBe("");
    expect(state.currentRxOpeMode).toBe("");
    expect(state.isReqRxModeUpdate).toBe(false);
  });
});
