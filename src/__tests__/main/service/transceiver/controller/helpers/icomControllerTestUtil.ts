import { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import type { ApiResponse } from "@/common/types/types.js";
import TransceiverIcomController from "@/main/service/transceiver/controller/TransceiverIcomController.js";
import { vi, type Mock } from "vitest";
import FakeSerialComm from "./FakeSerialComm.js";
import IcomRadioSimulator from "./IcomRadioSimulator.js";

/**
 * ICOMコントローラのテスト用ユーティリティ
 *
 * 前提：テストファイル側で、以下のモジュールを vi.mock でモックしていること。
 *   - "@/main/common/SerialComm.js"（FakeSerialCommに差し替え）
 *   - "@/main/main.js"（fireIpcEvent, getMainWindow）
 *   - "@/main/util/AppMainLogger.js"
 *   - "@/main/util/I18nUtil4Main.js"
 */

// IC-9700のCI-Vアドレス
export const CIV_IC9700 = 0xa2;
// IC-910のCI-Vアドレス
export const CIV_IC910 = 0x60;

// 周波数・運用モードのコールバック
type LinkCallback = (res: ApiResponse<UplinkType | DownlinkType>) => void;
// ドップラーシフト待機のコールバック
type WaitCallback = (res: ApiResponse<boolean>) => void;

export type IcomTestContext = {
  controller: TransceiverIcomController;
  sim: IcomRadioSimulator;
  freqCb: Mock<LinkCallback>;
  modeCb: Mock<LinkCallback>;
  waitCb: Mock<WaitCallback>;
  // 定期処理の間隔（ミリ秒）
  intervalMs: number;
  // 使用中のシリアル
  serial: () => FakeSerialComm;
  // 送信したコマンドを、プレフィックス・サフィックスを除いたコマンド部の16進数文字列で返す
  sentBodies: () => string[];
};

/**
 * ICOMコントローラのテストコンテキストを生成する（フェイクタイマーを有効化する）
 */
export function createIcomContext(
  opts: { civAddress?: number; transceiverId?: string; intervalSec?: string } = {}
): IcomTestContext {
  vi.useFakeTimers();
  FakeSerialComm.reset();

  const civAddress = opts.civAddress ?? CIV_IC9700;
  const sim = new IcomRadioSimulator(civAddress);
  FakeSerialComm.responder = sim.respond;

  const config = new AppConfigTransceiver();
  config.port = "COM1";
  config.baudrateBps = "19200";
  config.makerId = "1";
  config.transceiverId = opts.transceiverId ?? "2";
  config.civAddress = IcomRadioSimulator.hex(civAddress).toUpperCase();
  config.autoTrackingIntervalSec = opts.intervalSec ?? "1";

  const controller = new TransceiverIcomController(config);
  const freqCb = vi.fn<LinkCallback>();
  const modeCb = vi.fn<LinkCallback>();
  const waitCb = vi.fn<WaitCallback>();
  // TransceiverServiceと同様に、start前にコールバックを設定する
  controller.setFrequencyCallback(freqCb);
  controller.setModeCallback(modeCb);
  controller.setIsDopplerShiftWaitingCallback(waitCb);

  return {
    controller,
    sim,
    freqCb,
    modeCb,
    waitCb,
    intervalMs: parseFloat(config.autoTrackingIntervalSec) * 1000,
    serial: () => FakeSerialComm.last(),
    sentBodies: () =>
      FakeSerialComm.last()
        .sentHex()
        .map((hex) => hex.slice(8, -2)),
  };
}

/**
 * コントローラを開始し、送信履歴とコールバックの呼び出し履歴をクリアする
 */
export async function startAndClear(ctx: IcomTestContext): Promise<void> {
  await ctx.controller.start();
  ctx.serial().clearSent();
  ctx.freqCb.mockClear();
  ctx.modeCb.mockClear();
  ctx.waitCb.mockClear();
}

/**
 * 定期処理を1周期分進め、処理の完了を待つ
 */
export async function runOneCycle(ctx: IcomTestContext): Promise<void> {
  await vi.advanceTimersByTimeAsync(ctx.intervalMs);
  await settle();
}

/**
 * 保留中の非同期処理（マイクロタスク、0ms〜短時間のタイマー）を消化する
 */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await vi.advanceTimersByTimeAsync(0);
  }
}

/**
 * テストコンテキストを破棄する（コントローラを停止し、残ったタイマーを消化してから実時間に戻す）
 * memo: @synchronized の排他は、メソッドごとに全インスタンスで共有されるため、
 *       保留中の処理を残すと後続のテストが待たされる。必ず消化してから終了する。
 */
export async function disposeIcomContext(ctx: IcomTestContext): Promise<void> {
  await ctx.controller.stop();
  await vi.runOnlyPendingTimersAsync();
  await vi.advanceTimersByTimeAsync(5000);
  vi.useRealTimers();
}

/**
 * 周波数のBCD（CI-V形式）を返す（期待値の組み立て用）
 */
export function bcd(freqHz: number): string {
  return IcomRadioSimulator.encodeBcdFreq(freqHz);
}
