import SerialComm from "@/main/common/SerialComm.js";
import { SerialPort } from "serialport";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("serialport", () => ({
  SerialPort: vi.fn(function () {
    return { on: vi.fn(), pipe: vi.fn() };
  }),
}));
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("SerialComm ストップビット", () => {
  beforeEach(() => {
    vi.mocked(SerialPort).mockClear();
  });

  it("オプションを省略した場合は、ストップビット1でSerialPortを生成すること", () => {
    new SerialComm("COM1", 9600);

    expect(SerialPort).toHaveBeenCalledWith(
      expect.objectContaining({ path: "COM1", baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1 })
    );
  });

  it("stopBitsを省略したオプションの場合は、ストップビット1でSerialPortを生成すること", () => {
    new SerialComm("COM1", 9600, false, null, null, {});

    expect(SerialPort).toHaveBeenCalledWith(expect.objectContaining({ stopBits: 1 }));
  });

  it("stopBits=2を指定した場合は、ストップビット2でSerialPortを生成すること", () => {
    new SerialComm("COM1", 38400, false, null, null, { stopBits: 2 });

    expect(SerialPort).toHaveBeenCalledWith(expect.objectContaining({ baudRate: 38400, stopBits: 2 }));
  });

  it("ポート名が未指定の場合は、SerialPortを生成しないこと", () => {
    new SerialComm("", 9600, false, null, null, { stopBits: 2 });

    expect(SerialPort).not.toHaveBeenCalled();
  });
});
