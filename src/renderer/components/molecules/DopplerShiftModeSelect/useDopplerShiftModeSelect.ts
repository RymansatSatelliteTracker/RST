import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import I18nUtil from "@/renderer/common/util/I18nUtil";

export default function createDopplerShiftLabelMapping(): Record<string, string> {
  return {
    [Constant.DopplerShiftMode.FIXED_SAT]: I18nUtil.getMsg(I18nMsgs.G2_FIXED_SAT),
    [Constant.DopplerShiftMode.FIXED_RX]: I18nUtil.getMsg(I18nMsgs.G2_FIXED_RX),
    [Constant.DopplerShiftMode.FIXED_TX]: I18nUtil.getMsg(I18nMsgs.G2_FIXED_TX),
  };
}
