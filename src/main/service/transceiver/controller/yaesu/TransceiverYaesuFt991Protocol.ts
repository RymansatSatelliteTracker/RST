import CommonUtil from "@/common/CommonUtil.js";
import TransceiverYaesuFt991CmdMaker from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991CmdMaker.js";
import TransceiverYaesuFt991RecvParser from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991RecvParser.js";
import type {
  TransceiverYaesuProtocol,
  YaesuBand,
  YaesuNotify,
  YaesuRxStatus,
} from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuProtocol.js";
import type TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

// 読み取りコマンド（IF、TX）の応答のタイムアウト（ミリ秒）
const RECV_TIMEOUT_MS = 300;
// VFOの入れ替え（SV）の後、無線機が処理を終えるまでの待ち時間（ミリ秒）（実機で調整）
const SWAP_WAIT_MS = 50;
// VFOの入れ替えの終了後、入れ替えに起因する自動通知（AI）を無視し続ける時間（ミリ秒）（実機で調整）
const SWAP_NOTIFY_IGNORE_MS = 500;
// 定期読み取りの周期（周期ごとの制御間隔の倍数）
const POLL_EVERY_CYCLES = 5;

/**
 * FT-991 / FT-991A のCAT制御
 *
 * - Rx＝VFO-A、Tx＝VFO-B、SPLIT＝`FT3;`（VFO-Bで送信）として運用する。
 * - Setコマンドに応答はない（エラー時のみ `?;` を返す）。
 * - 無線機側の操作は、自動通知（AI）で検知する。
 * - VFO-Bの運用モード、およびトーンは、直接設定するコマンドがないため、VFOを入れ替えて（SV）、VFO-A側で設定し、元に戻す。
 */
export default class TransceiverYaesuFt991Protocol implements TransceiverYaesuProtocol {
  public readonly supportsAutoInfo = true;
  public readonly pollEveryCycles = POLL_EVERY_CYCLES;
  public readonly freqResolutionHz = 1;
  public readonly interCommandDelayMs = 0;

  private readonly cmdMaker = new TransceiverYaesuFt991CmdMaker();
  // この時刻（Date.now()）までに受信した自動通知は、VFOの入れ替えに起因するものとして無視する
  private ignoreNotifyUntilMs = 0;

  /**
   * 接続直後の初期化：自動通知（AI）を有効にし、SPLITをOFFにする
   */
  public async init(io: TransceiverYaesuSerialIo): Promise<void> {
    await io.send(this.cmdMaker.makeSetAutoInfo(true));
    await io.send(this.cmdMaker.makeSetSplit(false));
  }

  /**
   * 切断前の終了処理：自動通知（AI）を無効にする
   */
  public async term(io: TransceiverYaesuSerialIo): Promise<void> {
    await io.send(this.cmdMaker.makeSetAutoInfo(false));
  }

  /**
   * 自動通知（AI）を再有効化する（無線機の電源を入れ直すと、AIはOFFに戻るため）
   */
  public async refreshAutoInfo(io: TransceiverYaesuSerialIo): Promise<void> {
    await io.send(this.cmdMaker.makeSetAutoInfo(true));
  }

  public async setFreq(io: TransceiverYaesuSerialIo, band: YaesuBand, freqHz: number): Promise<boolean> {
    if (!TransceiverYaesuFt991CmdMaker.isFreqInRange(freqHz)) {
      AppMainLogger.warn(`FT-991で設定できない周波数のため、設定しません。 ${freqHz}Hz（設定可能：30kHz〜470MHz）`);
      return true;
    }

    // Rx＝VFO-A、Tx＝VFO-B
    const cmd = band === "RX" ? this.cmdMaker.makeSetFreqA(freqHz) : this.cmdMaker.makeSetFreqB(freqHz);
    return await io.send(cmd);
  }

  public async setMode(io: TransceiverYaesuSerialIo, band: YaesuBand, modeText: string): Promise<boolean> {
    const code = TransceiverYaesuFt991CmdMaker.modeTextToCode(modeText);
    if (code === null) {
      AppMainLogger.warn(`FT-991で設定できない運用モードのため、設定しません。 ${modeText}`);
      return true;
    }

    const cmd = this.cmdMaker.makeSetMode(code);
    if (band === "RX") {
      return await io.send(cmd);
    }

    // Tx（VFO-B）の運用モードは、VFOを入れ替えて設定する
    return await this.withSwappedVfo(io, async () => {
      await io.send(cmd);
    });
  }

  public async setSplit(io: TransceiverYaesuSerialIo, isOn: boolean): Promise<boolean> {
    return await io.send(this.cmdMaker.makeSetSplit(isOn));
  }

  public async setTone(io: TransceiverYaesuSerialIo, toneHz: number | null): Promise<boolean> {
    // 設定できないトーン周波数の場合は、VFOを入れ替える前に判定する
    let toneCmd: Uint8Array | null = null;
    if (toneHz !== null) {
      try {
        toneCmd = this.cmdMaker.makeSetCtcssTone(toneHz);
      } catch (e) {
        AppMainLogger.warn(`FT-991で設定できないトーン周波数のため、設定しません。 ${String(e)}`);
        return true;
      }
    }

    // Tx（VFO-B）のトーンは、VFOを入れ替えて設定する
    return await this.withSwappedVfo(io, async () => {
      if (toneCmd) {
        await io.send(this.cmdMaker.makeSetCtcss(true));
        await io.send(toneCmd);
      } else {
        await io.send(this.cmdMaker.makeSetCtcss(false));
      }
    });
  }

  public async readRx(io: TransceiverYaesuSerialIo): Promise<YaesuRxStatus | null> {
    const res = await io.sendAndRecv(this.cmdMaker.makeGetInfo(), { expectPrefix: "IF", timeoutMs: RECV_TIMEOUT_MS });
    if (!res) {
      return null;
    }

    const info = TransceiverYaesuFt991RecvParser.parseInfo(res);
    if (!info) {
      AppMainLogger.warn(`IFの応答を解析できませんでした。 ${res.toString("ascii")}`);
      return null;
    }
    return info;
  }

  /**
   * FT-991はVFO-Bへ直接周波数を設定できるため、Tx周波数の送信間引きは行わない
   */
  public getTxFreqSendThresholdHz(_modeText: string): number {
    return 0;
  }

  public resolveRecvMode(recvModeText: string, _currentModeText: string): string {
    return recvModeText;
  }

  public extractFrames(buffer: Buffer): { frames: Buffer[]; rest: Buffer } {
    return TransceiverYaesuFt991RecvParser.extractFrames(buffer);
  }

  /**
   * 自動通知（AI）のフレームを解析する
   * - Rx（VFO-A）の周波数、運用モード（FA、MD0、IF）のみを通知対象とする。Tx（VFO-B）の通知（FB、OIなど）は破棄する。
   * - VFOの入れ替え中、およびその直後の通知は、RSTの操作に起因するものとして破棄する。
   */
  public parseNotify(frame: Buffer): YaesuNotify[] {
    if (Date.now() < this.ignoreNotifyUntilMs) {
      return [];
    }

    if (TransceiverYaesuFt991RecvParser.isError(frame)) {
      return [{ type: "ERROR" }];
    }

    const freqHz = TransceiverYaesuFt991RecvParser.parseFreqA(frame);
    if (freqHz !== null) {
      return [{ type: "FREQ", freqHz }];
    }

    const modeText = TransceiverYaesuFt991RecvParser.parseMode(frame);
    if (modeText !== undefined) {
      return [{ type: "MODE", modeText }];
    }

    const info = TransceiverYaesuFt991RecvParser.parseInfo(frame);
    if (info) {
      const res: YaesuNotify[] = [{ type: "FREQ", freqHz: info.freqHz }];
      if (info.modeText) {
        res.push({ type: "MODE", modeText: info.modeText });
      }
      return res;
    }

    return [];
  }

  /**
   * VFOを入れ替えた状態で処理を行い、元に戻す
   * 入れ替え後は、VFO-A＝元のVFO-B（Tx側）となるため、VFO-A側にのみ設定できる項目（運用モード、トーン）をTx側に設定できる。
   * 送信中は、VFOの入れ替えで送信周波数が変わってしまうため、入れ替えない。
   * @returns 処理を行った場合はtrue、送信中などで処理を行わなかった場合（次周期の再試行が必要）はfalse
   */
  private async withSwappedVfo(io: TransceiverYaesuSerialIo, action: () => Promise<void>): Promise<boolean> {
    // 送信中は入れ替えない
    const txRes = await io.sendAndRecv(this.cmdMaker.makeGetTxState(), {
      expectPrefix: "TX",
      timeoutMs: RECV_TIMEOUT_MS,
    });
    const isTransmitting = txRes ? TransceiverYaesuFt991RecvParser.parseIsTransmitting(txRes) : null;
    if (isTransmitting !== false) {
      AppMainLogger.warn(
        isTransmitting === null
          ? `無線機の送信状態を取得できないため、VFOの入れ替えを行いません。`
          : `無線機が送信中のため、VFOの入れ替えを行いません。`
      );
      return false;
    }

    // 入れ替え中の自動通知を、無線機側の操作と誤認しないよう、無視する
    this.ignoreNotifyUntilMs = Number.POSITIVE_INFINITY;
    try {
      await io.send(this.cmdMaker.makeSwapVfo());
      await CommonUtil.sleep(SWAP_WAIT_MS);
      try {
        await action();
      } finally {
        // 処理に失敗した場合も、必ずVFOを元に戻す
        await io.send(this.cmdMaker.makeSwapVfo());
        await CommonUtil.sleep(SWAP_WAIT_MS);
      }
    } finally {
      this.ignoreNotifyUntilMs = Date.now() + SWAP_NOTIFY_IGNORE_MS;
    }

    return true;
  }
}
