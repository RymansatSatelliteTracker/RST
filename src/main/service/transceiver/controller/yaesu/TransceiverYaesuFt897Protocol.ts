import Constant from "@/common/Constant.js";
import TransceiverYaesuFt897CmdMaker from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897CmdMaker.js";
import TransceiverYaesuFt897RecvParser from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897RecvParser.js";
import type {
  TransceiverYaesuProtocol,
  YaesuBand,
  YaesuNotify,
  YaesuRxStatus,
} from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuProtocol.js";
import type TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";
import AppMainLogger from "@/main/util/AppMainLogger.js";

// 読み取りコマンドの応答のタイムアウト（ミリ秒）
const RECV_TIMEOUT_MS = 300;
// コマンド間の最小間隔（ミリ秒）（実機で調整）
const INTER_COMMAND_DELAY_MS = 50;
// Tx周波数の送信間引きの閾値（Hz）：SSB、CW、DIG系
const TX_FREQ_THRESHOLD_SSB_HZ = 50;
// Tx周波数の送信間引きの閾値（Hz）：FM系（FM、FM-D、AM）
const TX_FREQ_THRESHOLD_FM_HZ = 500;

/**
 * FT-897 / FT-897D のCAT制御
 *
 * - FT-897は、現在表示中のVFOの周波数・運用モードのみ設定・取得できるため、VFOを切り替えながら設定する。
 *   接続時に表示されているVFOをRx VFO、もう一方をTx VFOとみなし、SPLITで、Rx VFOで受信、Tx VFOで送信する。
 *   Tx VFOの設定の後は、必ずRx VFOに戻す。
 * - 現在どちらのVFOが表示されているかを取得するコマンドはないため、本クラスで保持する。
 * - 無線機側の操作の自動通知はないため、ポーリングで検知する。
 * - 送信中は、VFOを切り替えると送信周波数が変わってしまうため、Tx VFOの設定を行わない。
 */
export default class TransceiverYaesuFt897Protocol implements TransceiverYaesuProtocol {
  public readonly supportsAutoInfo = false;
  public readonly pollEveryCycles = 1;
  public readonly freqResolutionHz = 10;
  public readonly interCommandDelayMs = INTER_COMMAND_DELAY_MS;

  private readonly cmdMaker = new TransceiverYaesuFt897CmdMaker();
  // Rx VFOが表示されているか（接続時に表示されているVFOを、Rx VFOとみなす）
  private isRxVfoDisplayed = true;

  /**
   * 接続直後の初期化：SPLITをOFFにする（VFOは変更しない）
   */
  public async init(io: TransceiverYaesuSerialIo): Promise<void> {
    this.isRxVfoDisplayed = true;
    await io.send(this.cmdMaker.makeSetSplit(false));
  }

  /**
   * 切断前の終了処理：FT-897には、自動通知がないため、何もしない
   */
  public term(_io: TransceiverYaesuSerialIo): Promise<void> {
    return Promise.resolve();
  }

  /**
   * FT-897には、自動通知がないため、何もしない
   */
  public refreshAutoInfo(_io: TransceiverYaesuSerialIo): Promise<void> {
    return Promise.resolve();
  }

  public async setFreq(io: TransceiverYaesuSerialIo, band: YaesuBand, freqHz: number): Promise<boolean> {
    if (!TransceiverYaesuFt897CmdMaker.isFreqInRange(freqHz)) {
      AppMainLogger.warn(`FT-897で設定できない周波数のため、設定しません。 ${freqHz}Hz（設定可能：30kHz〜470MHz）`);
      return true;
    }

    const cmd = this.cmdMaker.makeSetFreq(freqHz);
    return await this.doOnBand(io, band, async () => {
      await io.send(cmd);
    });
  }

  public async setMode(io: TransceiverYaesuSerialIo, band: YaesuBand, modeText: string): Promise<boolean> {
    const code = TransceiverYaesuFt897CmdMaker.modeTextToCode(modeText);
    if (code === null) {
      AppMainLogger.warn(`FT-897で設定できない運用モードのため、設定しません。 ${modeText}`);
      return true;
    }

    const cmd = this.cmdMaker.makeSetMode(code);
    return await this.doOnBand(io, band, async () => {
      await io.send(cmd);
    });
  }

  public async setSplit(io: TransceiverYaesuSerialIo, isOn: boolean): Promise<boolean> {
    return await io.send(this.cmdMaker.makeSetSplit(isOn));
  }

  public async setTone(io: TransceiverYaesuSerialIo, toneHz: number | null): Promise<boolean> {
    // 設定できないトーン周波数の場合は、VFOを切り替える前に判定する
    let toneFreqCmd: Uint8Array | null = null;
    if (toneHz !== null) {
      try {
        toneFreqCmd = this.cmdMaker.makeSetToneFreq(toneHz);
      } catch (e) {
        AppMainLogger.warn(`FT-897で設定できないトーン周波数のため、設定しません。 ${String(e)}`);
        return true;
      }
    }

    // トーンは、送信側（Tx VFO）に設定する
    return await this.doOnBand(io, "TX", async () => {
      if (toneFreqCmd) {
        await io.send(this.cmdMaker.makeSetToneMode(true));
        await io.send(toneFreqCmd);
      } else {
        await io.send(this.cmdMaker.makeSetToneMode(false));
      }
    });
  }

  public async readRx(io: TransceiverYaesuSerialIo): Promise<YaesuRxStatus | null> {
    // Rx VFOが表示されていない場合は、Rx VFOに切り替えてから読み取る
    await this.ensureVfo(io, "RX");

    const res = await io.sendAndRecv(this.cmdMaker.makeGetFreqMode(), { expectBytes: 5, timeoutMs: RECV_TIMEOUT_MS });
    if (!res) {
      return null;
    }

    const status = TransceiverYaesuFt897RecvParser.parseFreqAndMode(res);
    if (!status) {
      AppMainLogger.warn(`周波数・運用モードの応答を解析できませんでした。 ${res.toString("hex")}`);
      return null;
    }
    return status;
  }

  /**
   * Tx周波数は、設定のたびにVFOの切り替えが必要で、その間は受信がTx周波数に移る。
   * そのため、ドップラー補正のような細かな変化は送信せず、一定以上の変化があった場合のみ送信する。
   */
  public getTxFreqSendThresholdHz(modeText: string): number {
    switch (modeText) {
      case Constant.Transceiver.OpeMode.FM:
      case Constant.Transceiver.OpeMode.FM_D:
      case Constant.Transceiver.OpeMode.AM:
        return TX_FREQ_THRESHOLD_FM_HZ;
      default:
        return TX_FREQ_THRESHOLD_SSB_HZ;
    }
  }

  /**
   * DIGは、側波帯（LSB/USB）を判別できないため、RSTが直前に要求したLSB-Dを維持する
   */
  public resolveRecvMode(recvModeText: string, currentModeText: string): string {
    if (recvModeText === Constant.Transceiver.OpeMode.USB_D && currentModeText === Constant.Transceiver.OpeMode.LSB_D) {
      return currentModeText;
    }
    return recvModeText;
  }

  public extractFrames(buffer: Buffer): { frames: Buffer[]; rest: Buffer } {
    return TransceiverYaesuFt897RecvParser.extractFrames(buffer);
  }

  /**
   * FT-897には、自動通知がない
   */
  public parseNotify(_frame: Buffer): YaesuNotify[] {
    return [];
  }

  /**
   * 指定のバンド（Rx VFO、Tx VFO）に対して、処理を行う
   * Tx VFOに対する処理は、送信中でない場合のみ、VFOを切り替えて行い、処理の後はRx VFOに戻す。
   * @returns 処理を行った場合はtrue、送信中などで処理を行わなかった場合（次周期の再試行が必要）はfalse
   */
  private async doOnBand(io: TransceiverYaesuSerialIo, band: YaesuBand, action: () => Promise<void>): Promise<boolean> {
    if (band === "RX") {
      await this.ensureVfo(io, "RX");
      await action();
      return true;
    }

    // 送信中は、VFOを切り替えない
    const isTransmitting = await this.isTransmitting(io);
    if (isTransmitting !== false) {
      AppMainLogger.warn(
        isTransmitting === null
          ? `無線機の送信状態を取得できないため、Tx VFOの設定を行いません。`
          : `無線機が送信中のため、Tx VFOの設定を行いません。`
      );
      return false;
    }

    try {
      await this.ensureVfo(io, "TX");
      await action();
    } finally {
      // 処理に失敗した場合も、必ずRx VFOに戻す
      await this.ensureVfo(io, "RX");
    }
    return true;
  }

  /**
   * 指定のバンドのVFOを表示する（既に表示している場合は何もしない）
   */
  private async ensureVfo(io: TransceiverYaesuSerialIo, band: YaesuBand): Promise<void> {
    const isRxTarget = band === "RX";
    if (this.isRxVfoDisplayed === isRxTarget) {
      return;
    }

    if (await io.send(this.cmdMaker.makeToggleVfo())) {
      this.isRxVfoDisplayed = isRxTarget;
    }
  }

  /**
   * 送信中かを取得する
   * @returns 取得できなかった場合はnull
   */
  private async isTransmitting(io: TransceiverYaesuSerialIo): Promise<boolean | null> {
    const res = await io.sendAndRecv(this.cmdMaker.makeGetTxStatus(), { expectBytes: 1, timeoutMs: RECV_TIMEOUT_MS });
    return res ? TransceiverYaesuFt897RecvParser.parseIsTransmitting(res) : null;
  }
}
