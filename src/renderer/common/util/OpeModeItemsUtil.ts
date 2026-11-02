import Constant from "@/common/Constant.js";
import type { AppConfigTransceiverDevice } from "@/common/model/AppConfigTransceiverModel.js";

/**
 * 運用モードの選択肢
 */
export type OpeModeItem = {
  // 選択肢に表示する文字列
  title: string;
  // 選択された場合の値（RSTの運用モード名。衛星設定などへは、この値を保存する）
  value: string;
};

/**
 * 運用モードの選択肢を、無線機の機種に応じて組み立てるユーティリティ
 */
export default class OpeModeItemsUtil {
  /**
   * 運用モードの選択肢を返す
   *
   * - 機種定義がない場合、または機種定義にsupportedModesがない場合は、全ての運用モード（DVを除く）を返す。
   * - supportedModesがある場合は、その運用モードのみを、supportedModesの順で返す（先頭は、未設定（空文字））。
   * - modeLabelsがある場合は、その運用モードの表示文字列（title）を、ラベルに置き換える（valueは運用モード名のまま）。
   * - DVは、画面上は選択できない（無線機からの受信時に設定される可能性があるのみ）ため、選択肢に含めない。
   *
   * memo: 保存済みの運用モードが選択肢にない場合（機種の変更前に保存された値など）は、選択肢を追加しなくても、
   *       v-selectは、その値をそのまま表示する（Vuetifyの仕様）ため、ここでは考慮しない。
   * @param device 選択中の無線機の機種定義（無線機が未設定の場合はnull）
   */
  public static buildItems(device: AppConfigTransceiverDevice | null | undefined): OpeModeItem[] {
    const allModes = Object.values(Constant.Transceiver.OpeMode) as string[];

    let modes = allModes;
    if (device?.supportedModes) {
      // 未設定（空文字）を先頭に、機種が対応する運用モードを、定義の順に並べる
      modes = [Constant.Transceiver.OpeMode.UNSET, ...device.supportedModes];
    }

    return modes
      .filter((mode) => mode !== Constant.Transceiver.OpeMode.DV)
      .map((mode) => ({ title: device?.modeLabels?.[mode] ?? mode, value: mode }));
  }
}
