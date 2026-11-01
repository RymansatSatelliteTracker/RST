import TransceiverIcomRecvParser from "@/main/service/transceiver/controller/TransceiverIcomRecvParser.js";
import { describe, expect, it } from "vitest";

describe("TransceiverIcomRecvParser.parseSatelliteMode", () => {
  it("サテライトモードOn（01）の場合はtrueを返すこと", () => {
    expect(TransceiverIcomRecvParser.parseSatelliteMode("fefee0a2165a01fd")).toBe(true);
  });

  it("サテライトモードOff（00）の場合はfalseを返すこと", () => {
    expect(TransceiverIcomRecvParser.parseSatelliteMode("fefee0a2165a00fd")).toBe(false);
  });

  it("IC-910形式（1a07）の応答も同じ位置で判定すること", () => {
    expect(TransceiverIcomRecvParser.parseSatelliteMode("fefee0601a0701fd")).toBe(true);
    expect(TransceiverIcomRecvParser.parseSatelliteMode("fefee0601a0700fd")).toBe(false);
  });

  it("01以外の値の場合はfalseを返すこと", () => {
    expect(TransceiverIcomRecvParser.parseSatelliteMode("fefee0a2165a02fd")).toBe(false);
    expect(TransceiverIcomRecvParser.parseSatelliteMode("")).toBe(false);
  });
});
