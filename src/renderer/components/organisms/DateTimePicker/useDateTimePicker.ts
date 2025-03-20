import { useStoreAutoState } from "@/renderer/store/useStoreAutoState";
import { ref } from "vue";

/**
 * DateTimeに表示する日時を生成/設定された日時を計算する
 * @returns {*} DateTimeに表示する日時/設定された日時
 */
const useDateTimePicker = () => {
  const autoStore = useStoreAutoState();

  /**
   * Autoモードの変更検知
   */
  autoStore.$subscribe(() => {
    // Autoモードの場合は、現在日時に強制設定する
    if (autoStore.isAutoMode()) {
      // TODO 表示日時のママの方がでデバッグしやすいので、一旦、現在日時に強制設定しない
      // setNow();
    }
  });

  // 現在日時
  const now = ref(new Date());
  // 設定日時
  const targetDate = ref(new Date());
  // 日時の各桁の変更量
  const deltaFormattedWeek10 = ref<number>(0);
  const deltaFormattedWeek1 = ref<number>(0);
  const deltaFormattedDate10 = ref<number>(0);
  const deltaFormattedDate1 = ref<number>(0);
  const deltaFormattedHours10 = ref<number>(0);
  const deltaFormattedHours1 = ref<number>(0);
  const deltaFormattedMinutes10 = ref<number>(0);
  const deltaFormattedMinutes1 = ref<number>(0);

  // DateTimeで設定された日時を計算する
  const adjustDate = (event: WheelEvent, unit: "weeks" | "days" | "hours" | "minutes", factor: number) => {
    // Autoモードの場合は日時の変更は不可
    if (autoStore.isAutoMode()) {
      return;
    }

    const delta = event.deltaY > 0 ? -factor : factor;

    switch (unit) {
      case "weeks":
        updateWeeks(delta);
        break;
      case "days":
        updateDays(delta);
        break;
      case "hours":
        updateHours(delta);
        break;
      case "minutes":
        updateMinutes(delta);
        break;
    }

    targetDate.value = getSetDate();
    now.value = new Date();
  };

  // 週の更新
  const updateWeeks = (factor: number) => {
    let totalWeeks = deltaFormattedWeek10.value * 10 + deltaFormattedWeek1.value + factor;
    if (totalWeeks < 0) totalWeeks = 0;
    if (totalWeeks > 99) totalWeeks = 99;
    deltaFormattedWeek10.value = Math.floor(totalWeeks / 10);
    deltaFormattedWeek1.value = totalWeeks % 10;
  };

  // 日の更新
  const updateDays = (factor: number) => {
    let totalDays = deltaFormattedDate10.value * 10 + deltaFormattedDate1.value + factor;
    if (totalDays < 0) totalDays = 0;
    if (totalDays > 99) totalDays = 99;
    deltaFormattedDate10.value = Math.floor(totalDays / 10);
    deltaFormattedDate1.value = totalDays % 10;
  };

  // 時間の更新
  const updateHours = (factor: number) => {
    let totalHours = deltaFormattedHours10.value * 10 + deltaFormattedHours1.value + factor;
    if (totalHours < 0) {
      if (deltaFormattedDate10.value === 0 && deltaFormattedDate1.value === 0) {
        totalHours = 0;
      } else {
        updateDays(-1);
        totalHours += 24;
      }
    }
    if (totalHours >= 24) {
      if (deltaFormattedDate10.value === 9 && deltaFormattedDate1.value === 9) {
        totalHours = 23;
      } else {
        updateDays(1);
        totalHours -= 24;
      }
    }
    deltaFormattedHours10.value = Math.floor(totalHours / 10);
    deltaFormattedHours1.value = totalHours % 10;
  };

  // 分の更新
  const updateMinutes = (factor: number) => {
    let totalMinutes = deltaFormattedMinutes10.value * 10 + deltaFormattedMinutes1.value + factor;
    if (totalMinutes < 0) {
      if (
        deltaFormattedHours10.value === 0 &&
        deltaFormattedHours1.value === 0 &&
        deltaFormattedDate10.value === 0 &&
        deltaFormattedDate1.value === 0
      ) {
        totalMinutes = 0;
      } else {
        updateHours(-1);
        totalMinutes += 60;
      }
    }
    if (totalMinutes >= 60) {
      if (
        deltaFormattedDate10.value === 9 &&
        deltaFormattedDate1.value === 9 &&
        deltaFormattedHours10.value === 2 &&
        deltaFormattedHours1.value === 3
      ) {
        totalMinutes = 59;
      } else {
        updateHours(1);
        totalMinutes -= 60;
      }
    }
    deltaFormattedMinutes10.value = Math.floor(totalMinutes / 10);
    deltaFormattedMinutes1.value = totalMinutes % 10;
  };

  // 設定日時を取得する
  const getSetDate = (): Date => {
    const weeks = deltaFormattedWeek10.value * 10 + deltaFormattedWeek1.value;
    const days = deltaFormattedDate10.value * 10 + deltaFormattedDate1.value;
    const hours = deltaFormattedHours10.value * 10 + deltaFormattedHours1.value;
    const minutes = deltaFormattedMinutes10.value * 10 + deltaFormattedMinutes1.value;

    const futureDate = new Date(now.value.getTime());
    futureDate.setDate(futureDate.getDate() + weeks * 7 + days);
    futureDate.setHours(futureDate.getHours() + hours);
    futureDate.setMinutes(futureDate.getMinutes() + minutes);

    return futureDate;
  };

  // 現在日時を設定する
  const setNow = () => {
    // Autoモードの場合は日時の変更は不可
    if (autoStore.isAutoMode()) {
      return;
    }

    targetDate.value = new Date();
    now.value = new Date();
    deltaFormattedWeek10.value = 0;
    deltaFormattedWeek1.value = 0;
    deltaFormattedDate10.value = 0;
    deltaFormattedDate1.value = 0;
    deltaFormattedHours10.value = 0;
    deltaFormattedHours1.value = 0;
    deltaFormattedMinutes10.value = 0;
    deltaFormattedMinutes1.value = 0;
  };

  // 毎秒現在日時を更新する
  setInterval(() => {
    targetDate.value = getSetDate();
    now.value = new Date();
  }, 1000);

  return {
    adjustDate,
    setNow,
    deltaFormattedWeek10,
    deltaFormattedWeek1,
    deltaFormattedDate10,
    deltaFormattedDate1,
    deltaFormattedHours10,
    deltaFormattedHours1,
    deltaFormattedMinutes10,
    deltaFormattedMinutes1,
    targetDate,
  };
};

export default useDateTimePicker;
