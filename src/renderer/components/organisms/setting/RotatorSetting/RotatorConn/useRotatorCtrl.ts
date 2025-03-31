import CommonUtil from "@/common/CommonUtil";
import Constant from "@/common/Constant";
import { AntennaPositionModel } from "@/common/model/AntennaPositionModel";
import { AppConfigRotator } from "@/common/model/AppConfigModel";
import ApiAntennaTracking from "@/renderer/api/ApiAntennaTracking";
import ApiSirial from "@/renderer/api/ApiSirial";
import { useValidate } from "@/renderer/common/hook/useValidate";
import RotatorSettingForm from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSettingForm";
import {
  azRange,
  elRange,
  RotatorRage,
  valiSchemaRotatorSetting,
} from "@/renderer/components/organisms/setting/RotatorSetting/useRotatorSettingValidate";
import { Ref } from "vue";

/**
 * ローテーター制御関係のフック
 */
export default function useRotatorCtrl(
  form: Ref<RotatorSettingForm>,
  currentPos: Ref<AntennaPositionModel>,
  errors: Ref<Record<string, string>>
) {
  // アンテナ移動で利用するsetIntervalの制御オブジェクト
  let moveIntevalObj: NodeJS.Timeout | null = null;
  const { validateAt } = useValidate(valiSchemaRotatorSetting);

  /**
   * シリアル接続
   */
  async function startNewConnect() {
    // 接続テストでシリアルが接続状態になっている場合があるので、一度クローズする
    await ApiSirial.close();

    // 一旦、古い監視を終了させてから、新しい監視を開始する
    await ApiAntennaTracking.stopCtrl();

    // ローテータが指定されている場合は、ローテーターの監視を開始する
    const rotConfig = createRotatorConfig();
    if (!CommonUtil.isEmpty(rotConfig.rotatorId)) {
      await ApiAntennaTracking.startCtrl(rotConfig);
    }
  }

  /**
   * AppConfigRotatorを生成する
   */
  function createRotatorConfig() {
    const rotatorConfig = new AppConfigRotator();
    rotatorConfig.port = form.value.port;
    rotatorConfig.baudrateBps = form.value.borate;
    rotatorConfig.makerId = form.value.makerId;
    rotatorConfig.rotatorId = form.value.rotatorId;
    rotatorConfig.ipAddress = form.value.ipAddress;
    rotatorConfig.ipPort = form.value.ipPort;
    return rotatorConfig;
  }

  /**
   * テスト移動向けの入力チェックを行う
   */
  async function checkInputVal() {
    // AZ、ELのどちらかがブランクの場合はエラー
    if (CommonUtil.isEmpty(form.value.testAz) || CommonUtil.isEmpty(form.value.testEl)) {
      return false;
    }

    // Validatorでのチェック
    const errorTextAz = await validateAt("testAz", form.value.testAz);
    if (!CommonUtil.isEmpty(errorTextAz)) {
      return false;
    }
    const errorTextEl = await validateAt("testEl", form.value.testEl);
    if (!CommonUtil.isEmpty(errorTextEl)) {
      return false;
    }

    return true;
  }

  /**
   * 入力エラーをクリアする
   */
  function clearValidateError() {
    errors.value.testAz = "";
    errors.value.testEl = "";
  }

  /**
   * テスト／移動
   */
  async function testMovePos() {
    // 無効値が入力されている場合は、ローテータへの送信は行わない
    if (!(await checkInputVal())) {
      return;
    }

    const pos = new AntennaPositionModel();
    pos.azimuth = currentPos.value.azimuth;
    pos.elevation = currentPos.value.elevation;

    if (!CommonUtil.isEmpty(form.value.testAz)) {
      pos.azimuth = Number(form.value.testAz);
    }
    if (!CommonUtil.isEmpty(form.value.testEl)) {
      pos.elevation = Number(form.value.testEl);
    }

    await ApiAntennaTracking.setAntennaPosition(pos);
  }

  /**
   * 位置指定が数値以外の場合は、0を設定する
   */
  function setZeroToTestAzElIfInvalid() {
    // ブランクの場合
    if (CommonUtil.isEmpty(form.value.testAz)) {
      form.value.testAz = "0";
    }
    if (CommonUtil.isEmpty(form.value.testEl)) {
      form.value.testEl = "0";
    }

    // 数値でない場合
    if (!CommonUtil.isNumber(form.value.testAz)) {
      form.value.testAz = "0";
    }
    if (!CommonUtil.isNumber(form.value.testEl)) {
      form.value.testEl = "0";
    }
  }

  /**
   * 指定値が範囲外の場合は、最大値または最小値を返す
   */
  function getAzElValIfOutOfRange(val: number, range: RotatorRage) {
    if (val < range.min) {
      return range.min;
    }

    if (val > range.max) {
      return range.max;
    }

    return val;
  }

  /**
   * 指定のAZ、EL値を加減算して位置指定に設定、およびアンテナを移動する
   */
  async function setTargetPosAndMove(azMoveVal: number = 0, elMoveVal: number = 0) {
    // 指定位置が無効値になっている場合は、0を設定
    setZeroToTestAzElIfInvalid();

    // 位置指定を加減算
    const targetAz = parseInt(form.value.testAz) + azMoveVal;
    const targetEl = parseInt(form.value.testEl) + elMoveVal;

    // 位置指定に書き戻し
    form.value.testAz = getAzElValIfOutOfRange(targetAz, azRange).toString();
    form.value.testEl = getAzElValIfOutOfRange(targetEl, elRange).toString();

    // アンテナを移動
    const pos = new AntennaPositionModel();
    pos.azimuth = parseInt(form.value.testAz);
    pos.elevation = parseInt(form.value.testEl);
    await ApiAntennaTracking.setAntennaPosition(pos);
  }

  /**
   * テスト／上
   * memo: 本メソッドのコール時に長押し想定のsetIntervalも設定される。解除はstopAntennaMoveで行う。
   */
  async function startElUp() {
    // setTargetPosAndMove()にて無効値は正常値に強制変更しているため、エラーをクリア
    clearValidateError();

    // 現在の位置指定に対して、定数値分移動
    setTargetPosAndMove(0, Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE);

    // 長押しの場合は、クリック時点の位置に対して、定数値分移動
    moveIntevalObj = setInterval(async () => {
      setTargetPosAndMove(0, Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE);
    }, Constant.Rotator.Setting.MOVE_TEST_INTERVAL_MS);
  }

  /**
   * テスト／下
   * memo: 本メソッドのコール時に長押し想定のsetIntervalも設定される。解除はstopAntennaMoveで行う。
   */
  async function startElDown() {
    // setTargetPosAndMove()にて無効値は正常値に強制変更しているため、エラーをクリア
    clearValidateError();

    // 現在の位置指定に対して、定数値分移動
    setTargetPosAndMove(0, Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE * -1);

    // 長押しの場合は、クリック時点の位置に対して、定数値分移動
    moveIntevalObj = setInterval(async () => {
      setTargetPosAndMove(0, Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE * -1);
    }, Constant.Rotator.Setting.MOVE_TEST_INTERVAL_MS);
  }

  /**
   * テスト／右
   * memo: 本メソッドのコール時に長押し想定のsetIntervalも設定される。解除はstopAntennaMoveで行う。
   */
  async function startAzUp() {
    // setTargetPosAndMove()にて無効値は正常値に強制変更しているため、エラーをクリア
    clearValidateError();

    // 現在の位置指定に対して、定数値分移動
    setTargetPosAndMove(Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE, 0);

    // 長押しの場合は、クリック時点の位置に対して、定数値分移動
    moveIntevalObj = setInterval(async () => {
      setTargetPosAndMove(Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE, 0);
    }, Constant.Rotator.Setting.MOVE_TEST_INTERVAL_MS);
  }

  /**
   * テスト／左
   * memo: 本メソッドのコール時に長押し想定のsetIntervalも設定される。解除はstopAntennaMoveで行う。
   */
  async function startAzDown() {
    // setTargetPosAndMove()にて無効値は正常値に強制変更しているため、エラーをクリア
    clearValidateError();

    // 現在の位置指定に対して、定数値分移動
    setTargetPosAndMove(Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE * -1, 0);

    // 長押しの場合は、クリック時点の位置に対して、定数値分移動
    moveIntevalObj = setInterval(async () => {
      setTargetPosAndMove(Constant.Rotator.Setting.MOVE_TEST_VAL_DEGREE * -1, 0);
    }, Constant.Rotator.Setting.MOVE_TEST_INTERVAL_MS);
  }

  /**
   * テスト／移動の中断
   */
  function stopAntennaMove() {
    if (!moveIntevalObj) {
      return;
    }
    clearInterval(moveIntevalObj);
  }

  return { startNewConnect, startElUp, startElDown, startAzUp, startAzDown, stopAntennaMove, testMovePos };
}
