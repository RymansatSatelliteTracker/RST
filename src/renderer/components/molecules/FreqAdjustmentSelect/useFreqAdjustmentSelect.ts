import { FrequencyUtil } from "@/renderer/util/FrequencyUtil";
import { computed, ref, type Ref } from "vue";
/**
 * 周波数コントローラー
 * @param {Ref<string>} frequency 周波数
 * @returns {*} 周波数コントローラー
 */
const useFrequencySelect = (frequency: Ref<string>) => {
  const parsedDigits = computed(() => {
    const digits = FrequencyUtil.parseSignedFrequency(frequency.value);
    return digits;
  });

  const sign = computed(() => parsedDigits.value[0]);
  const kHzDigits = computed(() => parsedDigits.value[1][0]);
  const hzDigits = computed(() => parsedDigits.value[1][1]);

  // マウスホバー中のインデックス
  const hoverIndex = ref<number | null>(null);

  // ホイールイベントの処理
  function onWheel(event: WheelEvent, index: number) {
    const newDigits = [...kHzDigits.value, ...hzDigits.value];
    let newSign = sign.value;

    // ゼロマタギ(指定の桁以上が0)の場合は、ホイールを回した方向に応じて符号を変更する
    const idx = newDigits.findIndex((digit) => digit !== 0);
    const firstNonZeroIndex = idx !== -1 ? idx : newDigits.length;
    if (index < firstNonZeroIndex) {
      newDigits[index] = 1;
      // ホイールを上に回したらプラス、下に回したらマイナス
      newSign = event.deltaY < 0 ? 1 : -1;
      // 数値の配列をカンマ区切りの文字列にする
      return FrequencyUtil.formatSignedFrequency(newDigits, newSign);
    }

    if ((event.deltaY < 0 && sign.value === 1) || (event.deltaY > 0 && sign.value === -1)) {
      // digit部分が増えるケース：符号がプラスでホイールを上に回した場合 or 符号がマイナスでホイールを下に回した場合
      newDigits[index] = (newDigits[index] + 1) % 10;
      for (let i = index; i > 0; i--) {
        if (newDigits[i] === 0) {
          // 繰り上がり処理
          newDigits[i - 1] = (newDigits[i - 1] + 1) % 10;
        } else {
          break;
        }
      }
    } else {
      // digit部分が減るケース
      newDigits[index] = (newDigits[index] + 9) % 10;
      for (let i = index; i > 0; i--) {
        if (newDigits[i] === 9) {
          // 繰り下がり処理
          newDigits[i - 1] = (newDigits[i - 1] + 9) % 10;
        } else {
          break;
        }
      }
    }

    // 全ての桁が0となる場合は+0で返すため符号をプラスにする
    newSign = newDigits.every((digit) => digit === 0) ? 1 : sign.value;
    // 数値の配列をカンマ区切りの文字列にする
    return FrequencyUtil.formatSignedFrequency(newDigits, newSign);
  }

  // 右クリックイベントの処理
  function onRightClick(index: number) {
    const newDigits = [...kHzDigits.value, ...hzDigits.value];

    // 右クリックされた桁を含めて以降を0にする
    for (let i = index; i < newDigits.length; i++) {
      newDigits[i] = 0;
    }

    // 全ての桁が0となる場合は+0で返すため符号をプラスにする
    const newSign = newDigits.every((digit) => digit === 0) ? 1 : sign.value;

    // 数値の配列をカンマ区切りの文字列にする
    return FrequencyUtil.formatSignedFrequency(newDigits, newSign);
  }

  // 左クリックイベントの処理
  function onClick(index: number) {
    const newDigits = [...kHzDigits.value, ...hzDigits.value];
    // 左クリックされた桁を+1する
    newDigits[index] = (newDigits[index] + 1) % 10;
    for (let i = index; i > 0; i--) {
      if (newDigits[i] === 0) {
        newDigits[i - 1] = (newDigits[i - 1] + 1) % 10;
      } else {
        break;
      }
    }
    // 数値の配列をカンマ区切りの文字列にする
    return FrequencyUtil.formatSignedFrequency(newDigits, sign.value);
  }

  // 先頭の0の桁をグレーアウトする
  function isGrayed(index: number) {
    const newDigits = [...kHzDigits.value, ...hzDigits.value];
    const idx = newDigits.findIndex((digit) => digit !== 0);
    // 0の場合は全てグレーアウト
    const firstNonZeroIndex = idx !== -1 ? idx : newDigits.length;
    return index < firstNonZeroIndex;
  }

  return {
    sign,
    kHzDigits,
    hzDigits,
    hoverIndex,
    onWheel,
    onRightClick,
    onClick,
    isGrayed,
  };
};

export default useFrequencySelect;
