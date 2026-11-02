import Constant from "@/common/Constant.js";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import type { DownlinkType, UplinkType } from "@/common/types/satelliteSettingTypes.js";
import type { ApiResponse } from "@/common/types/types.js";
import TransceiverYaesuController from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuController.js";
import TransceiverYaesuFt897Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897Protocol.js";
import TransceiverYaesuFt991Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991Protocol.js";
import { vi, type Mock } from "vitest";
import FakeSerialComm from "./FakeSerialComm.js";
import { Ft897Simulator, Ft991Simulator } from "./YaesuRadioSimulators.js";
import { runWithTimers } from "./yaesuProtocolTestUtil.js";

/**
 * YAESUコントローラのテスト用ユーティリティ
 *
 * 前提：テストファイル側で、以下のモジュールを vi.mock でモックしていること。
 *   - "@/main/common/SerialComm.js"（FakeSerialCommに差し替え）
 *   - "@/main/main.js"（fireIpcEvent, getMainWindow）
 *   - "@/main/util/AppMainLogger.js"
 *   - "@/main/util/I18nUtil4Main.js"
 *
 * 定期処理は、タイマー（setInterval）には任せず、onTimer（1周期分の処理）を直接呼び出して、1周期ずつ検証する。
 * （制御間隔を十分に長くし、タイマーによる定期処理は起動しないようにする）
 */

// 周波数・運用モードのコールバック
type LinkCallback = (res: ApiResponse<UplinkType | DownlinkType>) => void;
// ドップラーシフト待機のコールバック
type WaitCallback = (res: ApiResponse<boolean>) => void;

export type YaesuTestContext<SIM> = {
  controller: TransceiverYaesuController;
  sim: SIM;
  freqCb: Mock<LinkCallback>;
  modeCb: Mock<LinkCallback>;
  waitCb: Mock<WaitCallback>;
  serial: () => FakeSerialComm;
  /** 送信履歴を、16進数文字列で返す */
  sentHex: () => string[];
  /** 送信履歴を、ASCII文字列で返す */
  sentAscii: () => string[];
  /** 送信履歴、コールバックの呼び出し履歴をクリアする */
  clear: () => void;
  /** 開始する */
  start: () => Promise<void>;
  /** 定期処理を1周期分実行する */
  cycle: () => Promise<void>;
  /** 保留中のタイマーを進めながら、処理の完了を待つ */
  run: <T>(promise: Promise<T>) => Promise<T>;
  /** 周波数のコールバックに通知されたデータ */
  freqData: () => unknown[];
  /** 運用モードのコールバックに通知されたデータ */
  modeData: () => unknown[];
};

/**
 * FT-897のテストコンテキストを生成する（フェイクタイマーを有効化する）
 */
export function createFt897Context(): YaesuTestContext<Ft897Simulator> {
  const sim = new Ft897Simulator();
  return createContext(
    new TransceiverYaesuFt897Protocol(),
    sim,
    sim.respond,
    Constant.Transceiver.TransceiverId.YAESU_FT897
  );
}

/**
 * FT-991のテストコンテキストを生成する（フェイクタイマーを有効化する）
 */
export function createFt991Context(): YaesuTestContext<Ft991Simulator> {
  const sim = new Ft991Simulator();
  return createContext(
    new TransceiverYaesuFt991Protocol(),
    sim,
    sim.respond,
    Constant.Transceiver.TransceiverId.YAESU_FT991
  );
}

function createContext<SIM>(
  protocol: TransceiverYaesuFt897Protocol | TransceiverYaesuFt991Protocol,
  sim: SIM,
  responder: (sent: Uint8Array) => Uint8Array[],
  transceiverId: string
): YaesuTestContext<SIM> {
  vi.useFakeTimers();
  FakeSerialComm.reset();
  FakeSerialComm.responder = responder;

  const config = new AppConfigTransceiver();
  config.port = "COM1";
  config.baudrateBps = "4800";
  config.makerId = Constant.Transceiver.MakerId.YAESU;
  config.transceiverId = transceiverId;
  // タイマーによる定期処理が起動しないよう、制御間隔を十分に長くする
  config.autoTrackingIntervalSec = "3600";

  const controller = new TransceiverYaesuController(config, protocol, 2);
  const freqCb = vi.fn<LinkCallback>();
  const modeCb = vi.fn<LinkCallback>();
  const waitCb = vi.fn<WaitCallback>();
  controller.setFrequencyCallback(freqCb);
  controller.setModeCallback(modeCb);
  controller.setIsDopplerShiftWaitingCallback(waitCb);

  const run = <T>(promise: Promise<T>) => runWithTimers(promise, 50);

  return {
    controller,
    sim,
    freqCb,
    modeCb,
    waitCb,
    serial: () => FakeSerialComm.last(),
    sentHex: () => FakeSerialComm.last().sentHex(),
    sentAscii: () => FakeSerialComm.last().sent.map((b) => Buffer.from(b).toString("ascii")),
    clear: () => {
      FakeSerialComm.last().clearSent();
      freqCb.mockClear();
      modeCb.mockClear();
      waitCb.mockClear();
    },
    start: async () => {
      await run(controller.start());
    },
    // memo: onTimerはprivateだが、1周期分の処理を直接呼び出すため、ブラケット記法で呼び出す
    cycle: async () => {
      await run(controller["onTimer"]());
    },
    run,
    freqData: () => freqCb.mock.calls.map(([res]) => res.data),
    modeData: () => modeCb.mock.calls.map(([res]) => res.data),
  };
}

/**
 * テストコンテキストを破棄する（コントローラを停止し、実時間に戻す）
 */
export async function disposeYaesuContext<SIM>(ctx: YaesuTestContext<SIM>): Promise<void> {
  await ctx.run(ctx.controller.stop());
  await vi.runOnlyPendingTimersAsync();
  vi.useRealTimers();
}
