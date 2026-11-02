import type TransceiverYaesuSerialIo from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuSerialIo.js";

/**
 * バンド（RST側の論理的な区別）
 * - RX：受信側（ダウンリンク）
 * - TX：送信側（アップリンク）
 */
export type YaesuBand = "RX" | "TX";

/**
 * 無線機から読み取った受信側（Rx）の周波数・運用モード
 */
export type YaesuRxStatus = {
  // 周波数（Hz）
  freqHz: number;
  // 運用モード（RSTのモード名）。RSTで扱えないモードの場合はnull
  modeText: string | null;
};

/**
 * 自動通知（AI）の解析結果
 * - 受信側（Rx）の周波数・運用モードの通知のみを返す（送信側（Tx）の通知は、解析時に破棄する）
 */
export type YaesuNotify =
  | { type: "FREQ"; freqHz: number }
  | { type: "MODE"; modeText: string | null }
  // コマンドのエラー応答
  | { type: "ERROR" };

/**
 * YAESU無線機のCAT制御（ワイヤレベルの処理）を機種ごとに抽象化するインターフェース
 *
 * 機種固有の手順（FT-897のVFO切替、FT-991のVFO入替など）は各実装の内部に閉じ込め、
 * コントローラは「Rx/Txの周波数・モードを設定する」「Rxを読み取る」という論理操作のみを呼び出す。
 *
 * 設定系のメソッド（set*）の戻り値：
 * - true：設定を送信した、または、設定できない値のため意図的に破棄した（再試行は不要）
 * - false：今回は設定できなかった（送信中などの一時的な理由）。次の周期で再試行する
 */
export interface TransceiverYaesuProtocol {
  /** 無線機側の操作を自動通知（AI）で受け取れるか */
  readonly supportsAutoInfo: boolean;

  /** 定期読み取り（readRx）を何周期に1回行うか（1＝毎周期） */
  readonly pollEveryCycles: number;

  /** 無線機のCAT周波数の分解能（Hz）。周波数の比較は、この分解能に丸めた値で行う */
  readonly freqResolutionHz: number;

  /** コマンド間の最小間隔（ミリ秒）。無線機が連続したコマンドを処理しきれない機種向け（0は間隔なし） */
  readonly interCommandDelayMs: number;

  /** 接続直後の初期化（AI有効化、SPLIT OFFの送信など） */
  init(io: TransceiverYaesuSerialIo): Promise<void>;

  /** 切断前の終了処理（AI無効化など） */
  term(io: TransceiverYaesuSerialIo): Promise<void>;

  /** 定期読み取りの周期で、自動通知を再有効化する（自動通知に非対応の機種は何もしない） */
  refreshAutoInfo(io: TransceiverYaesuSerialIo): Promise<void>;

  /** 周波数を設定する */
  setFreq(io: TransceiverYaesuSerialIo, band: YaesuBand, freqHz: number): Promise<boolean>;

  /** 運用モード（RSTのモード名）を設定する */
  setMode(io: TransceiverYaesuSerialIo, band: YaesuBand, modeText: string): Promise<boolean>;

  /** SPLIT（サテライトモード）を設定する */
  setSplit(io: TransceiverYaesuSerialIo, isOn: boolean): Promise<boolean>;

  /** Tx側のCTCSSトーンを設定する（toneHz=nullでOFF） */
  setTone(io: TransceiverYaesuSerialIo, toneHz: number | null): Promise<boolean>;

  /** Rx側の周波数・運用モードを読み取る。読み取れなかった場合はnull */
  readRx(io: TransceiverYaesuSerialIo): Promise<YaesuRxStatus | null>;

  /**
   * Tx周波数を無線機へ送信する最小の変化量（Hz）を返す
   * 前回送信した値との差がこれ未満の場合は、送信しない（0は毎回送信）
   */
  getTxFreqSendThresholdHz(modeText: string): number;

  /**
   * 無線機から受信した運用モードを、RST側の運用モードに解決する
   * 無線機側の表現がRSTのモードと1対1に対応しない場合（FT-897のDIGなど）に、RSTが現在保持しているモードを維持する。
   * @param recvModeText 無線機から受信した運用モード（RSTのモード名）
   * @param currentModeText RSTが現在保持している運用モード
   */
  resolveRecvMode(recvModeText: string, currentModeText: string): string;

  /** 受信バッファから、完結したフレームを切り出す。残り（未完結のデータ）は rest に返す */
  extractFrames(buffer: Buffer): { frames: Buffer[]; rest: Buffer };

  /** 自動通知のフレームを解析する（自動通知に非対応の機種は空配列を返す） */
  parseNotify(frame: Buffer): YaesuNotify[];
}
