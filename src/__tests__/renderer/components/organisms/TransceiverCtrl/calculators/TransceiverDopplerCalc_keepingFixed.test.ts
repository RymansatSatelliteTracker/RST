import TransceiverDopplerCalc from "@/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc.js";
import ActiveSatServiceHub from "@/renderer/service/ActiveSatServiceHub.js";
import FrequencyTrackService from "@/renderer/service/FrequencyTrackService.js";
import { afterEach, describe, expect, it, vi } from "vitest";

const currentDate = new Date("2025-01-01T12:00:00Z");
const intervalMs = 1000;

// ドップラーファクターを固定値で返すFrequencyTrackServiceを生成する（逆算ロジックは実物を使う）
const createService = (down: number, up: number) => {
  const service = new FrequencyTrackService({} as never);
  vi.spyOn(service, "calcDownlinkDopplerFactor").mockResolvedValue(down);
  vi.spyOn(service, "calcUplinkDopplerFactor").mockResolvedValue(up);
  return service;
};

const mockService = (service: FrequencyTrackService | null) => {
  vi.spyOn(ActiveSatServiceHub.getInstance(), "getFrequencyTrackService").mockReturnValue(service);
};

// ドット区切りの周波数文字列を数値へ変換する
const toHz = (s: string) => Number(s.replaceAll(".", ""));

describe("TransceiverDopplerCalc 固定側維持", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const rxNom = 435_800_000;
  const txNom = 145_900_000;

  describe("calcTxFreqKeepingRxFixed", () => {
    it("FrequencyTrackServiceが取得できない場合、nullを返すこと", async () => {
      mockService(null);
      const result = await new TransceiverDopplerCalc().calcTxFreqKeepingRxFixed(
        rxNom,
        txNom,
        0,
        0,
        rxNom,
        currentDate,
        intervalMs
      );
      expect(result).toBeNull();
    });

    it("ドップラーファクター1.0のとき、Txは基準周波数のままであること", async () => {
      mockService(createService(1.0, 1.0));
      const result = await new TransceiverDopplerCalc().calcTxFreqKeepingRxFixed(
        rxNom,
        txNom,
        0,
        0,
        rxNom,
        currentDate,
        intervalMs
      );
      expect(toHz(result!)).toBe(txNom);
    });

    it("下りドップラー係数が変化しても、算出したTxで固定Rxが維持されること", async () => {
      const down = 1.00001;
      const up = 0.99999;
      mockService(createService(down, up));
      const result = await new TransceiverDopplerCalc().calcTxFreqKeepingRxFixed(
        rxNom,
        txNom,
        0,
        0,
        rxNom,
        currentDate,
        intervalMs
      );

      // 衛星内の上り周波数 = Tx / 上り係数、下り周波数 = Sum - 上り周波数、観測Rx = 下り周波数 × 下り係数
      const satUp = toHz(result!) / up;
      const observedRx = (rxNom + txNom - satUp) * down;
      expect(Math.abs(observedRx - rxNom)).toBeLessThan(5);
    });

    it("補正値がある場合も、固定Rxが維持されること", async () => {
      const down = 0.99998;
      const up = 1.00002;
      const rxAdj = 100;
      const txAdj = -200;
      const fixedRx = 435_800_100;
      mockService(createService(down, up));
      const result = await new TransceiverDopplerCalc().calcTxFreqKeepingRxFixed(
        rxNom,
        txNom,
        rxAdj,
        txAdj,
        fixedRx,
        currentDate,
        intervalMs
      );

      const satUp = toHz(result!) / up - txAdj;
      const observedRx = (rxNom + txNom - satUp + rxAdj) * down;
      expect(Math.abs(observedRx - fixedRx)).toBeLessThan(5);
    });
  });

  describe("calcRxFreqKeepingTxFixed", () => {
    it("FrequencyTrackServiceが取得できない場合、nullを返すこと", async () => {
      mockService(null);
      const result = await new TransceiverDopplerCalc().calcRxFreqKeepingTxFixed(
        rxNom,
        txNom,
        0,
        0,
        txNom,
        currentDate,
        intervalMs
      );
      expect(result).toBeNull();
    });

    it("ドップラーファクター1.0のとき、Rxは基準周波数のままであること", async () => {
      mockService(createService(1.0, 1.0));
      const result = await new TransceiverDopplerCalc().calcRxFreqKeepingTxFixed(
        rxNom,
        txNom,
        0,
        0,
        txNom,
        currentDate,
        intervalMs
      );
      expect(toHz(result!)).toBe(rxNom);
    });

    it("上りドップラー係数が変化しても、固定Txに対して算出したRxが整合すること", async () => {
      const down = 1.00001;
      const up = 0.99999;
      mockService(createService(down, up));
      const result = await new TransceiverDopplerCalc().calcRxFreqKeepingTxFixed(
        rxNom,
        txNom,
        0,
        0,
        txNom,
        currentDate,
        intervalMs
      );

      // 固定Txが衛星へ届く上り周波数 = Tx / 上り係数、下り周波数 = Sum - 上り周波数、Rx = 下り周波数 × 下り係数
      const satDown = rxNom + txNom - txNom / up;
      expect(Math.abs(toHz(result!) - satDown * down)).toBeLessThan(5);
    });

    it("補正値がある場合も整合すること", async () => {
      const down = 0.99998;
      const up = 1.00002;
      const rxAdj = 100;
      const txAdj = -200;
      mockService(createService(down, up));
      const result = await new TransceiverDopplerCalc().calcRxFreqKeepingTxFixed(
        rxNom,
        txNom,
        rxAdj,
        txAdj,
        txNom,
        currentDate,
        intervalMs
      );

      const satDown = rxNom + txNom - (txNom / up - txAdj);
      expect(Math.abs(toHz(result!) - (satDown + rxAdj) * down)).toBeLessThan(5);
    });
  });
});
