import Constant from "@/common/Constant";
import type { PassData, PassesCache, TempPassData } from "@/renderer/types/pass-type";
import GroundStationService, { VisibilityType } from "./GroundStationService";
import type SatelliteService from "./SatelliteService";

/**
 * 2か所の地上局から同時に人工衛星が観測できる重複するAOS/LOS/Melを計算する
 * @class OverlapPassesService
 * @extends {GroundStationService}
 */
class OverlapPassesService extends GroundStationService {
  // 地上局1(自局)クラスの実体
  private _groundStation1: GroundStationService;
  // 地上局2(他局)クラスの実体
  private _groundStation2: GroundStationService;

  /**
   * コンストラクタ
   * @constructor
   * @param {SatelliteService} satelliteService SatelliteServiceクラスの実体
   * @param {number} latitudeDeg1 地上局1(自局)の緯度[単位:度]
   * @param {number} longitudeDeg1 地上局1(自局)の経度[単位:度]
   * @param {number} latitudeDeg2 地上局2(他局)の緯度[単位:度]
   * @param {number} longitudeDeg2 地上局2(他局)の経度[単位:度]
   * @param {number} [altitudeM1=0.0] 地上局1(自局)の高度[単位:m]
   * @param {number} [altitudeM2=0.0] 地上局2(他局)の高度[単位:m]
   * @param {number} [validMinElDeg1=0.0] 地上局1(自局)の有効な最低仰角[単位:度]
   * @param {number} [validMinElDeg2=0.0] 地上局2(他局)の有効な最低仰角[単位:度]
   */
  constructor(
    satelliteService: SatelliteService,
    latitudeDeg1: number,
    longitudeDeg1: number,
    latitudeDeg2: number,
    longitudeDeg2: number,
    altitudeM1: number = 0.0,
    altitudeM2: number = 0.0,
    validMinElDeg1: number = 0.0,
    validMinElDeg2: number = 0.0
  ) {
    // スーパークラスのコンストラクタ
    super(satelliteService, latitudeDeg1, longitudeDeg1, altitudeM1, validMinElDeg1);
    // 地上局1(自局)クラスの実体を格納する
    this._groundStation1 = new GroundStationService(
      satelliteService,
      latitudeDeg1,
      longitudeDeg1,
      altitudeM1,
      validMinElDeg1
    );
    // 地上局2(他局)クラスの実体を格納する
    this._groundStation2 = new GroundStationService(
      satelliteService,
      latitudeDeg2,
      longitudeDeg2,
      altitudeM2,
      validMinElDeg2
    );
  }

  /**
   * 指定した日時で2か所の地上局から人工衛星が可視/不可視判定を取得する
   * @param {Date} date 日時
   * @returns {Promise<boolean>} 可視/不可視判定(可視: true、不可視: false)
   */
  public isSatelliteVisibleAsync = async (date: Date): Promise<boolean> => {
    // 地上局1(自局)から人工衛星の可視/不可視判定を取得する
    const isVisible1 = await this._groundStation1.isSatelliteVisibleAsync(date);
    // 地上局2(他局)から人工衛星の可視/不可視判定を取得する
    const isVisible2 = await this._groundStation2.isSatelliteVisibleAsync(date);
    if (isVisible1 && isVisible2) {
      // 人工衛星が可視の場合は(可視: true)を返却する
      return true;
    } else {
      // 人工衛星が不可視の場合は(不可視: false)を返却する
      return false;
    }
  };

  /**
   * 指定した日時期間で2か所の地上局から同時に人工衛星が観測できるパスを取得する
   * @param {Date} startDate 日時期間(開始)
   * @param {Date} endDate 日時期間(終了)
   * @returns {Promise<PassesCache[] | null>} 重複するパス配列
   */
  public getOverlapPassesListAsync = async (startDate: Date, endDate: Date): Promise<PassesCache[] | null> => {
    // 現在日時を取得する
    const nowDate = new Date();
    if (endDate) {
      if (endDate <= nowDate || endDate <= startDate) {
        // 日時期間(終了)が現在日時より古い、または、日時期間(開始)と日時期間(終了)の時系列が逆転している場合はnullを返却する
        return null;
      }
    }

    if (
      this._groundStation1.getVisibilityType() === VisibilityType.ALWAYS_VISIBLE &&
      this._groundStation2.getVisibilityType() === VisibilityType.ALWAYS_VISIBLE
    ) {
      // 2か所の地上局で人工衛星が常に可視の場合は地上局1(自局)から観測できるパスを返却する
      const passesCache1 = await this._groundStation1.getOrbitPassListAsync(startDate, endDate);
      return passesCache1;
    } else if (
      this._groundStation1.getVisibilityType() === VisibilityType.ALWAYS_INVISIBLE ||
      this._groundStation2.getVisibilityType() === VisibilityType.ALWAYS_INVISIBLE
    ) {
      // 2か所の地上局のうち、どちらかで人工衛星が常に不可視の場合はnullを返却する
      return null;
    } else if (
      this._groundStation1.getVisibilityType() === VisibilityType.VISIBLE &&
      this._groundStation2.getVisibilityType() === VisibilityType.ALWAYS_VISIBLE
    ) {
      // 地上局2(他局)だけ人工衛星が常に可視の場合は地上局1(自局)から観測できるパスを取得する
      const passesCache1 = await this._groundStation1.getOrbitPassListAsync(startDate, endDate);
      if (!passesCache1 || passesCache1.length === 0) {
        // 地上局1(自局)から観測できるパスが取得できなかった場合はnullを返却する
        return null;
      }

      // 地上局1(自局)から観測できるパスを返却する
      return passesCache1
        .map((passesCache) => passesCache)
        .filter((overlapPass): overlapPass is PassesCache => overlapPass != null);
    } else if (
      this._groundStation1.getVisibilityType() === VisibilityType.ALWAYS_VISIBLE &&
      this._groundStation2.getVisibilityType() === VisibilityType.VISIBLE
    ) {
      // 地上局1(自局)だけ人工衛星が常に可視の場合は地上局2(他局)から観測できるパスを取得する
      const passesCache2 = await this._groundStation2.getOrbitPassListAsync(startDate, endDate);
      if (!passesCache2 || passesCache2.length === 0) {
        // 地上局2(他局)から観測できるパスが取得できなかった場合はnullを返却する
        return null;
      }

      // 地上局2(他局)から観測できるパスを返却する
      return passesCache2
        .map((passesCache) => passesCache)
        .filter((overlapPass): overlapPass is PassesCache => overlapPass != null);
    }

    // 開始日時から終了日時まで重複するパスを探索して返却する
    return await this._calculateOverlapPassesAsync(startDate, endDate);
  };

  /**
   * 指定した日時期間で重複するパスを取得する
   * @param {Date} startDate 日時期間(開始)
   * @param {(Date)} endDate 日時期間(終了)
   * @returns {Promise<PassesCache[] | null>} 重複するパス配列
   */
  private _calculateOverlapPassesAsync = async (startDate: Date, endDate: Date): Promise<PassesCache[] | null> => {
    // 地上局1(自局)から観測できるパス
    const passesCache1 = await this._groundStation1.getOrbitPassListAsync(startDate, endDate);
    // 地上局2(他局)から観測できるパス
    const passesCache2 = await this._groundStation2.getOrbitPassListAsync(startDate, endDate);

    if (!passesCache1 || passesCache1.length === 0 || !passesCache2 || passesCache2.length === 0) {
      // 2か所の地上局のうち、どちらかでパスが取得できない場合はnullを返却する
      return null;
    }

    // 2か所の地上局で重複するパスを探索する
    const overlappingPeriods = await Promise.all(
      passesCache1.flatMap(async (pass1) => {
        const overlaps = await Promise.all(
          passesCache2
            .filter(
              (pass2) =>
                pass1 &&
                pass1.aos &&
                pass1.los &&
                pass2 &&
                pass2.aos &&
                pass2.los &&
                pass1.aos.date <= pass2.los.date &&
                pass1.los.date >= pass2.aos.date
            )
            .map(async (pass2) => {
              if (pass1 && pass1.aos && pass1.maxEl && pass1.los && pass2 && pass2.aos && pass2.los) {
                // 重複するパスの日時期間(開始)を取得する
                const overlapStartDate = new Date(Math.max(pass1.aos.date.getTime(), pass2.aos.date.getTime()));
                // 重複するパスの日時期間(終了)を取得する
                const overlapEndDate = new Date(Math.min(pass1.los.date.getTime(), pass2.los.date.getTime()));
                // 重複するパスの日時期間(開始)から人工衛星の位置を取得する
                const startTargetLocation = this._satelliteService.getTargetPolarLocationInDegree(overlapStartDate);
                // 重複するパスの日時期間(終了)から人工衛星の位置を取得する
                const endTargetLocation = this._satelliteService.getTargetPolarLocationInDegree(overlapEndDate);
                // 重複するパスの日時期間(開始)から地上局1(自局)で観測できる人工衛星の仰角/方位角を取得する
                const startTargetLookAngles = this._groundStation1.getSatelliteLookAngles(overlapStartDate);
                // 重複するパスの日時期間(終了)から地上局1(自局)で観測できる人工衛星の仰角/方位角を取得する
                const endTargetLookAngles = this._groundStation1.getSatelliteLookAngles(overlapEndDate);
                if (!startTargetLocation || !endTargetLocation) {
                  // 人工衛星が消滅した場合はnullを返却する
                  return null;
                }
                // MaxElは地上局1(自局)で観測できる人工衛星の仰角を設定する
                let overlapMaxEl1: PassData = pass1.maxEl;
                if (overlapMaxEl1.date < overlapStartDate || overlapEndDate < overlapMaxEl1.date) {
                  // 地上局1(自局)のMaxElが可視範囲外の場合は可視範囲内のMaxElを再取得する
                  overlapMaxEl1 = await this._recalculateMaxElInRangeAsync(
                    overlapStartDate.getTime(),
                    overlapEndDate.getTime()
                  );
                }
                // 重複するパスを返却する
                return {
                  aos: {
                    date: overlapStartDate,
                    lookAngles: startTargetLookAngles,
                    satLocation: startTargetLocation,
                  } as PassData,
                  maxEl: overlapMaxEl1,
                  los: {
                    date: overlapEndDate,
                    lookAngles: endTargetLookAngles,
                    satLocation: endTargetLocation,
                  } as PassData,
                  durationMs: (overlapEndDate.getTime() - overlapStartDate.getTime()) as number | null,
                };
              }
            })
        );
        return overlaps.filter((overlapPass): overlapPass is PassesCache => overlapPass != null);
      })
    );

    return overlappingPeriods.flat();
  };

  /**
   * 地上局1(自局)の指定された日時期間の最大仰角を再取得する
   * @param {number} startTime 探索開始日時
   * @param {number} endTime 探索終了日時
   * @returns {Promise<PassData>} パスの最大仰角
   */
  private _recalculateMaxElInRangeAsync = async (startTime: number, endTime: number): Promise<PassData> => {
    // 探索終了日時を取得する
    const searchEndMin = (endTime - startTime) / Constant.Time.MILLISECONDS_IN_MINUTE;
    // パスの最大仰角探索時の周期ステップ数を初期化する
    let searchMinStep = 1;
    // パスの最大仰角の一時キャッシュを初期化する
    let overlapMaxEl: TempPassData = { date: null, elevation: 0.0 };

    for (let i = 0; i <= searchEndMin; i += searchMinStep) {
      // i分後の日時を取得する
      const searchDate = new Date(startTime + i * Constant.Time.MILLISECONDS_IN_MINUTE);
      // 地上局1(自局)からの人工衛星の仰角を計算する
      const elevation = this._satelliteService.getSatelliteElevationAngle(searchDate, this._ecefLocation);
      if (!elevation) {
        // 人工衛星が消滅した場合はnullを返却する
        return null;
      }

      if (elevation) {
        if (elevation >= 0.0) {
          if (elevation > overlapMaxEl.elevation) {
            // 前回周期で取得した仰角より大きい場合は最大仰角を更新する
            overlapMaxEl = { date: searchDate, elevation: elevation };
          }
        }
        // パス探索時の周期ステップ数を取得する
        searchMinStep = this._getSearchMinStep(elevation);
      }
    }

    if (overlapMaxEl.date !== null) {
      // パスの詳細な最大仰角を探索する
      overlapMaxEl = this._prepareBinarySearchMaxElevationArgs(overlapMaxEl.date, overlapMaxEl.elevation);
    }
    if (overlapMaxEl.date === null) {
      // パスのMaxElが取得できなかった場合はnullを返却する
      return null;
    } else {
      // パスの最大仰角を返却する
      return this._setPassData(overlapMaxEl.date, overlapMaxEl.elevation);
    }
  };
}

export default OverlapPassesService;
