import Constant from "@/common/Constant";
import type { EcefLocation, PolarLocation } from "@/renderer/types/location-type";
import type {
  LookAngles,
  PassData,
  PassesCache,
  TempPassCache,
  TempPassData,
  TimeInterval,
} from "@/renderer/types/pass-type";
import CoordinateCalcUtil from "@/renderer/util/CoordinateCalcUtil";
import type SatelliteService from "./SatelliteService";

/**
 * 可視時間の探索種別
 * @enum {number}
 */
const enum SearchType {
  AOS = 0,
  LOS = 1,
}

/**
 * 人工衛星の可視種別
 * @enum {number}
 */
export const enum VisibilityType {
  ALWAYS_VISIBLE = 0,
  ALWAYS_INVISIBLE = 1,
  VISIBLE = 2,
}

// 可視時間帯を算出する際の現在日時オフセット（分）
const CURRENT_DATE_OFFSET_MINUTES = 60;

/**
 * 地上局から観測できる人工衛星のAOS/LOS/Melを計算する
 * @class GroundStationService
 */
class GroundStationService {
  // SatelliteServiceクラスの実体
  protected _satelliteService: SatelliteService;
  // 地上局の緯度経度(WGS84系)
  protected _polarLocation: PolarLocation;
  // 地上局の地心直交座標(WGS84回転楕円体)
  protected _ecefLocation: EcefLocation;
  // AOS/LOS/Melのキャッシュ配列
  private _passesCache: PassesCache[] = [];
  // 人工衛星の可視種別
  private _isVisible: VisibilityType = VisibilityType.VISIBLE;
  // 計算済み終端時間
  private _calculatedTime: number = 0;
  // 未探索日時区間配列
  private _unexploredTime: TimeInterval[] = [];
  // 有効な最低仰角
  private _validMinEl: number = 0.0;
  // 運用開始日(UTC日時)
  private _operationStartUtcDate: Date | null = null;

  /**
   * コンストラクタ
   * @constructor
   * @param {SatelliteService} satelliteService SatelliteServiceクラスの実体
   * @param {number} latitudeDeg 地上局の緯度[単位:度]
   * @param {number} longitudeDeg 地上局の経度[単位:度]
   * @param {number} [altitudeM=0.0] 地上局の高度[単位:m]
   * @param {number} [validMinElDeg=0.0] 有効な最低仰角[単位:度]
   * @param {Date | null} [operationStartUtcDate=null] 運用開始日(UTC日時)
   */
  constructor(
    satelliteService: SatelliteService,
    latitudeDeg: number,
    longitudeDeg: number,
    altitudeM: number = 0.0,
    validMinElDeg: number = 0.0,
    operationStartUtcDate: Date | null = null
  ) {
    // SatelliteServiceクラスの実体を格納する
    this._satelliteService = satelliteService;
    // 有効な最低仰角を設定する
    this._validMinEl = validMinElDeg;

    if (operationStartUtcDate) {
      // 運用開始日(UTC日時)を設定する
      this._operationStartUtcDate = operationStartUtcDate;
    }

    // 高度の単位を[m]から[km]に換算する
    const altitudeKm = CoordinateCalcUtil.mToKm(altitudeM);
    // 観測地点の地心直交座標(WGS84回転楕円体)を設定する
    const ecef = CoordinateCalcUtil.geodeticInDegreeToEcef(latitudeDeg, longitudeDeg, altitudeKm);
    this._ecefLocation = {
      x: ecef.x,
      y: ecef.y,
      z: ecef.z,
      radius: CoordinateCalcUtil.getEarthRadiusInDegree(latitudeDeg),
      height: altitudeKm,
    };
    // 観測地点の緯度経度(WGS84系)を設定する
    this._polarLocation = {
      latitude: latitudeDeg,
      longitude: longitudeDeg,
      radius: (Constant.Astronomy.EARTH_EQUATOR_RADIUS_KM + Constant.Astronomy.EARTH_POLAR_RADIUS_KM) / 2.0,
      height: altitudeKm,
    };
    // 人工衛星の可視種別を設定する
    this._setVisibilityType();
  }

  /**
   * 人工衛星の可視種別を設定する
   */
  private _setVisibilityType = () => {
    // 現在日時を取得する
    let currentDate = new Date();
    if (this._operationStartUtcDate) {
      // 運用開始日時が設定された場合は現在日時を運用開始日時とする
      currentDate = this._operationStartUtcDate;
    }
    if (this._satelliteService.isGeostationaryOrbit()) {
      // 観測地点からの人工衛星の仰角を取得する
      const elevation = this._satelliteService.getSatelliteElevationAngle(currentDate, this._ecefLocation);
      if (elevation) {
        if (elevation >= this._validMinEl) {
          // 最大仰角が有効な最低仰角より大きい場合は静止衛星(常に可視)とする
          this._isVisible = VisibilityType.ALWAYS_VISIBLE;
          // 静止衛星が常に可視の場合はキャッシュ配列を初期化して、仰角を格納する
          this._passesClear();
          this._addPassToCache({
            aos: null,
            maxEl: { date: currentDate, elevation: elevation },
            los: null,
          });
        } else {
          // 静止衛星(常に不可視)
          this._isVisible = VisibilityType.ALWAYS_INVISIBLE;
        }
      } else {
        // 人工衛星が消滅した場合は低軌道衛星のため静止衛星でない
        this._isVisible = VisibilityType.VISIBLE;
      }
    } else {
      // 静止衛星でない
      this._isVisible = VisibilityType.VISIBLE;
      if (this._satelliteService.isOverSiderealDay()) {
        // 軌道周期が1恒星日以上の場合は直近のパスを取得して常に可視/不可視でないか判定する
        this.getOrbitPassAsync(currentDate);
      }
    }
  };

  /**
   * 人工衛星の可視種別を取得する
   * @returns {VisibilityType} 可視種別
   */
  public getVisibilityType = (): VisibilityType => {
    return this._isVisible;
  };

  /**
   * 指定した日時の人工衛星の可視/不可視判定を取得する
   * @param {Date} date 日時
   * @returns {Promise<boolean>} 可視/不可視判定(可視: true、不可視: false)
   */
  public isSatelliteVisibleAsync = async (date: Date): Promise<boolean> => {
    if (this._isVisible === VisibilityType.ALWAYS_VISIBLE) {
      // 人工衛星が常に可視の場合は(可視: true)を返却する
      return true;
    } else if (this._isVisible === VisibilityType.ALWAYS_INVISIBLE) {
      // 人工衛星が常に不可視の場合は(不可視: false)を返却する
      return false;
    }

    // 人工衛星の仰角が正の場合は(可視: true)を返却する
    const elevation = this._satelliteService.getSatelliteElevationAngle(date, this._ecefLocation);
    if (elevation && elevation >= 0.0) {
      return true;
    } else {
      // 人工衛星の仰角が負の場合は(不可視: false)を返却する
      return false;
    }
  };

  /**
   * 指定した日時の人工衛星の仰角/方位角を取得する
   * @param {Date} date 日時
   * @returns {(LookAngles | null)} 仰角/方位角
   */
  public getSatelliteLookAngles = (date: Date): LookAngles | null => {
    // 指定した日時の人工衛星の仰角を取得する
    const elevation = this._satelliteService.getSatelliteElevationAngle(date, this._ecefLocation);
    // 指定した日時の人工衛星の方位角を取得する
    const azimuth = this._satelliteService.getSatelliteAzimuthAngle(date, this._ecefLocation);
    if (elevation && azimuth) {
      return { elevation: elevation, azimuth: azimuth };
    } else {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }
  };

  /**
   * 指定した日時から最も近いパスを取得する
   * @param {Date} startDate 日時期間(開始)
   * @returns {Promise<PassesCache | null>} パス
   */
  public getOrbitPassAsync = async (startDate: Date): Promise<PassesCache | null> => {
    if (this._isVisible === VisibilityType.ALWAYS_VISIBLE) {
      // 人工衛星が常に可視の場合は仰角だけが格納されたパスを返却する
      return this._passesCache[0];
    } else if (this._isVisible === VisibilityType.ALWAYS_INVISIBLE) {
      // 人工衛星が常に不可視の場合はnullを返却する
      return null;
    }

    // 開始日時から最も近いパスを返却する
    const passesCacheInRange = await this._calculatePassesInRangeAsync(startDate, null);
    if (passesCacheInRange && passesCacheInRange.length > 0) {
      return passesCacheInRange[0];
    } else {
      // 探索した結果が常に不可視の場合はnullを返却する
      return null;
    }
  };

  /**
   * 指定した日時期間のパス配列を取得する
   * @param {Date} startDate 日時期間(開始)
   * @param {Date} endDate 日時期間(終了)
   * @returns {Promise<PassesCache[] | null>} パス配列
   */
  public getOrbitPassListAsync = async (startDate: Date, endDate: Date): Promise<PassesCache[] | null> => {
    // 現在日時を取得する
    let currentDate = new Date();
    if (this._operationStartUtcDate) {
      // 運用開始日時が設定された場合は現在日時を運用開始日時とする
      currentDate = this._operationStartUtcDate;
    }
    if (endDate) {
      if (endDate <= currentDate || endDate <= startDate) {
        // 日時期間(終了)が現在日時より古い、または、日時期間(開始)と日時期間(終了)の時系列が逆転している場合はnullを返却する
        return null;
      }
    }

    if (this._isVisible === VisibilityType.ALWAYS_VISIBLE) {
      // 人工衛星が常に可視の場合は仰角だけが格納されたパスを返却する
      return this._passesCache;
    } else if (this._isVisible === VisibilityType.ALWAYS_INVISIBLE) {
      // 人工衛星が常に不可視の場合はnullを返却する
      return null;
    }

    // 開始日時から終了日時までパスを探索して返却する
    return await this._calculatePassesInRangeAsync(startDate, endDate);
  };

  /**
   * 指定された日時期間のパスを計算する
   * @param {Date} startDate 日時期間(開始)
   * @param {(Date | null)} endDate 日時期間(終了)(指定した日時から最も近いパスを取得する場合: null)
   * @returns {Promise<PassesCache[] | null>} パスのキャッシュ配列
   */
  private _calculatePassesInRangeAsync = async (
    startDate: Date,
    endDate: Date | null
  ): Promise<PassesCache[] | null> => {
    if (this._passesCache.length > Constant.OrbitCalculation.MAX_PASSES_CACHES_SIZE) {
      // パスのキャッシュ配列が最大要素数を超えた場合は初期化する
      this._passesClear();
    }

    // 現在日時を取得する
    let currentDate = new Date();
    if (this._operationStartUtcDate) {
      // 運用開始日時が設定された場合は現在日時を運用開始日時とする
      currentDate = this._operationStartUtcDate;
    }

    // 現在日時からN分前の時刻を判定用の現在時刻とする
    // memo: LOS後のローテータ、無線機の継続追尾を可能とするため、現在時刻が過ぎたパスも処理対象に含める必要がある
    const startOffsetDate = new Date(
      currentDate.getTime() - CURRENT_DATE_OFFSET_MINUTES * Constant.Time.MILLISECONDS_IN_MINUTE
    );

    // AOS/LOS/Melの一時キャッシュ配列を初期化する
    let tempPassesCache: PassesCache[] = [];

    // 初回実行時の場合
    if (this._calculatedTime === 0) {
      // 日時期間(開始)が過去日時の場合は現在日時に設定する
      let targetStartDate = startDate;
      if (targetStartDate <= startOffsetDate) {
        targetStartDate = startOffsetDate;
      } else {
        // 日時期間(開始)が未来日時の場合は、現在日時から日時期間(開始)を未探索日時区間配列に追加する
        this._addUnexploredTime(startOffsetDate.getTime(), targetStartDate.getTime());
      }

      // 計算済み終端時間を初期化する
      this._initCalculatedTime();
      if (endDate) {
        // 日時期間(開始)から日時期間(終了)までのパスを探索する
        await this._updatePassListAsync(targetStartDate.getTime(), endDate.getTime());
        tempPassesCache = [...this._passesCache];
      } else {
        // 日時期間(開始)から最も近いパスを探索する
        await this._updatePassListAsync(targetStartDate.getTime(), null);
        tempPassesCache = [...this._passesCache];
      }

      // 2回目以降実行時の場合
    } else {
      // 過去日時のLOSが含まれるキャッシュ配列要素を除外してメンバ変数を更新する
      this._passesCache = [...this._passesCache].filter((cache) => cache.los && startOffsetDate < cache.los.date);
      // 過去日時の未探索日時区間(終了)が含まれる配列要素を除外してメンバ変数を更新する
      this._unexploredTime = [...this._unexploredTime].filter(
        (cache) => startOffsetDate.getTime() < cache.endTime && cache.startTime < cache.endTime
      );

      let targetStartDate = startDate;
      if (targetStartDate <= startOffsetDate) {
        // 日時期間(開始)が過去日時の場合は現在日時に設定する
        targetStartDate = startOffsetDate;
      } else if (this._calculatedTime < targetStartDate.getTime()) {
        // 日時期間(開始)が計算済み終端時間より新しい場合は、計算済み終端時間から日時期間(開始)を未探索日時区間配列に追加する
        this._addUnexploredTime(this._calculatedTime, targetStartDate.getTime());
      }

      if (endDate) {
        // 日時期間(開始)から日時期間(終了)までのパスを取得する場合
        if (this._calculatedTime < endDate.getTime()) {
          // 日時期間(終了)が計算済み終端時間より新しい場合は追加で探索する
          if (this._calculatedTime < targetStartDate.getTime()) {
            // 日時期間(開始)が計算済み終端時間より新しい場合は日時期間(開始)から日時期間(終了)までのパスを探索する
            await this._updatePassListAsync(targetStartDate.getTime(), endDate.getTime());
          } else {
            // 日時期間(開始)から日時期間(終了)の間に計算済み終端時間が跨る場合は計算済み終端時間から日時期間(終了)のパスを探索する
            await this._updatePassListAsync(this._calculatedTime, endDate.getTime());
            // 日時期間(開始)から日時期間(終了)の間に計算済み終端時間が跨る場合は日時期間(開始)から計算済み終端時間までの未探索日時区間配列を更新する
            await this._updateUnexploredTime(targetStartDate.getTime(), this._calculatedTime);
          }
        } else {
          // 日時期間(終了)が計算済み終端時間より古い場合は日時期間(開始)から日時期間(終了)までの未探索日時区間配列を更新する
          await this._updateUnexploredTime(targetStartDate.getTime(), endDate.getTime());
        }
        // 取得日時期間のパスを取得する
        tempPassesCache = [...this._passesCache].filter(
          (cache) => cache.los && cache.los.date >= targetStartDate && cache.aos && cache.aos.date <= endDate
        );
      } else {
        if (this._calculatedTime < targetStartDate.getTime()) {
          // 日時期間(開始)が計算済み終端時間より新しい場合は日時期間(開始)から最も近いパスを探索する
          await this._updatePassListAsync(targetStartDate.getTime(), null);
        } else {
          // 日時期間(開始)が計算済み終端時間より古い場合はキャッシュ配列を初期化する
          this._passesClear();
          // 計算済み終端時間から日時期間(開始)を未探索日時区間配列に追加する
          this._addUnexploredTime(this._calculatedTime, targetStartDate.getTime());
          // 日時期間(開始)から最も近いパスを探索する
          await this._updatePassListAsync(targetStartDate.getTime(), null);
        }
        // 取得日時期間のパスを取得する
        tempPassesCache = [...this._passesCache].filter((cache) => cache.los && cache.los.date >= targetStartDate);
      }
    }

    if (this._isVisible === VisibilityType.ALWAYS_VISIBLE) {
      // パスが取得できなかった場合（人工衛星が常に可視）は仰角だけが格納されたパスを返却する
      return this._passesCache;
    } else if (this._isVisible === VisibilityType.ALWAYS_INVISIBLE) {
      // パスが取得できなかった場合（人工衛星が常に不可視）はnullを返却する
      return null;
    }

    // パスが取得できた場合はAOS日時で昇順ソートして返却する
    return tempPassesCache.sort((a, b) => {
      if (!a.aos || !b.aos) {
        // AOS日時がnullの場合はソートしない
        return 0;
      }
      return a.aos.date.getTime() - b.aos.date.getTime();
    });
  };

  /**
   * 指定した未探索日時区間を更新する
   * @async
   * @param {number} startTime 未探索日時区間(開始)
   * @param {number} endTime 未探索日時区間(終了)
   */
  private _updateUnexploredTime = async (startTime: number, endTime: number): Promise<void> => {
    // 未探索日時区間配列に存在する該当日時区間を取得する
    const tempUnexploredTime = [...this._unexploredTime]
      .filter((cache) => cache.startTime <= endTime && startTime <= cache.endTime)
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) {
          // 未探索日時区間(開始)がnullの場合はソートしない
          return 0;
        }
        // 未探索日時区間(開始)で昇順ソートして返却する
        return a.startTime - b.startTime;
      });
    if (tempUnexploredTime.length !== 0) {
      for (let i = 0; i < tempUnexploredTime.length; i++) {
        // 未探索日時区間(開始)を取得する
        let start = tempUnexploredTime[i].startTime;
        if (start < startTime) {
          // 未探索日時区間(開始)より日時期間(開始)が新しい場合は日時期間(開始)で更新する
          start = startTime;
        }

        // 未探索日時区間(終了)を取得する
        let end: number | null = tempUnexploredTime[i].endTime;
        if (endTime) {
          if (endTime < end) {
            // 未探索日時区間(終了)より日時期間(終了)が古い場合は日時期間(終了)で更新する
            end = endTime;
          }
          if (end <= start) {
            // 日時期間(開始)と日時期間(終了)の時系列が逆転している場合はスキップする
            continue;
          }
        }

        // 未探索日時区間の開始日時から終了日時までのパスを探索する
        const calculatedTime = await this._updatePassListAsync(start, end);
        if (calculatedTime) {
          // 開始日時から探索完了日時までの未探索日時区間配列を更新する
          this._cleanupUnexploredTime(startTime, calculatedTime);
        }
      }
    }
    return;
  };

  /**
   * 指定した未探索日時区間をクリーンアップする
   * @param {number} startTime 日時区間(開始)
   * @param {number} endTime 日時区間(終了)
   */
  private _cleanupUnexploredTime = (startTime: number, endTime: number) => {
    this._unexploredTime = [...this._unexploredTime].flatMap((cache) => {
      if (startTime <= cache.startTime && cache.endTime <= endTime) {
        // 指定した日時区間が未探索日時区間を完全にカバーしている場合は未探索日時区間を空にする
        return [];
      } else if (cache.endTime <= cache.startTime) {
        // 日時期間(開始)と日時期間(終了)の時系列が逆転している場合は未探索日時区間を空にする
        return [];
      } else if (cache.startTime < startTime && endTime < cache.endTime) {
        // 指定した日時区間が未探索日時区間内に存在する場合は未探索日時区間を2つに分割する
        return [
          { startTime: cache.startTime, endTime: startTime },
          { startTime: endTime, endTime: cache.endTime },
        ];
      } else if (startTime <= cache.startTime && cache.startTime <= endTime) {
        // 指定した日時区間が未探索日時区間(開始)だけをカバーしている場合は未探索日時区間を更新する
        return [{ startTime: endTime, endTime: cache.endTime }];
      } else if (startTime <= cache.endTime && cache.endTime <= endTime) {
        // 指定した日時区間が未探索日時区間(終了)だけをカバーしている場合は未探索日時区間を更新する
        return [{ startTime: cache.startTime, endTime: startTime }];
      } else {
        // 指定した日時区間が未探索日時区間をカバーしていない場合は未探索日時区間はそのままにする
        return [cache];
      }
    });
  };

  /**
   * 指定した日時期間のパスを探索してキャッシュ配列に格納する
   * @param {number} startTime 探索開始日時
   * @param {(number | null)} endTime 探索終了日時(指定した日時から最も近いパスを取得する場合: null)
   * @returns {Promise<number | null>} 探索完了日時
   */
  private _updatePassListAsync = async (startTime: number, endTime: number | null): Promise<number | null> => {
    // AOS/LOS/Melの一時キャッシュ
    let tempPassCache: TempPassCache = this._initTempPassCache();

    // 探索時間範囲(分)は初期値を1恒星日とする
    let searchEndMin = Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY;
    if (endTime) {
      // 探索終了日時が設定されている場合は探索終了日時まで探索する
      searchEndMin = (endTime - startTime) / Constant.Time.MILLISECONDS_IN_MINUTE;
      // 探索終了日時の時点でLOSだけ設定できない場合
      const endTimeElevation = this._satelliteService.getSatelliteElevationAngle(new Date(endTime), this._ecefLocation);
      if (endTimeElevation) {
        if (endTimeElevation >= 0.0) {
          // 探索終了日時を跨ぐパスを取得するように探索時間範囲(分)を1恒星日延長する
          searchEndMin += Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY;
        }
      } else {
        // 人工衛星が消滅した場合はnullを返却する
        return null;
      }
    } else {
      if (this._satelliteService.getOrbitalPeriodInMin() > Constant.Astronomy.MINUTES_IN_SIDEREAL_DAY) {
        // 探索終了日時が設定されていない、かつ、軌道周期が1恒星日より大きい場合は軌道周期先まで探索する
        searchEndMin = this._satelliteService.getOrbitalPeriodInMin();
      }
    }
    searchEndMin = Math.floor(searchEndMin);

    // パス探索時の周期ステップ数を初期化する
    let searchMinStep = 1;
    const startTimeElevation = this._satelliteService.getSatelliteElevationAngle(
      new Date(startTime),
      this._ecefLocation
    );
    if (!startTimeElevation) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }

    // 探索開始日時を元に周期ステップ数(分)を更新する
    searchMinStep = this._getSearchMinStep(startTimeElevation);
    // 探索開始日時を跨ぐパスを取得する
    if (startTimeElevation >= 0.0) {
      for (let i = 0; i <= searchEndMin; i += searchMinStep) {
        // i分前の日時を取得する
        const searchDate = new Date(startTime - i * Constant.Time.MILLISECONDS_IN_MINUTE);
        // 観測地点から人工衛星の仰角を計算する
        const elevation = this._satelliteService.getSatelliteElevationAngle(searchDate, this._ecefLocation);
        if (!elevation) {
          // 人工衛星が消滅した場合はnullを返却する
          return null;
        }

        if (tempPassCache.aos?.date === null) {
          if (elevation <= 0.0) {
            // 探索日時から日時期間(開始)までの未探索日時区間配列を更新する
            this._cleanupUnexploredTime(searchDate.getTime(), startTime);
            if (searchDate.getTime() < this._calculatedTime && this._calculatedTime < startTime) {
              // 計算済み終端時間に到達した場合は探索処理を中断する
              break;
            }
            // 前回周期の日時を元にAOSを探索する
            tempPassCache.aos = this._binarySearchAosLos(
              searchDate,
              new Date(searchDate.getTime() + searchMinStep * Constant.Time.MILLISECONDS_IN_MINUTE),
              SearchType.AOS
            );
            break;
          } else if (elevation > tempPassCache.maxEl.elevation) {
            // 前回周期で取得した仰角より大きい場合は最大仰角を更新する
            tempPassCache.maxEl = { date: searchDate, elevation: elevation };
          }
        }
        // パス探索時の周期ステップ数を取得する
        searchMinStep = this._getSearchMinStep(elevation);
      }
      if (
        tempPassCache.aos?.date === null &&
        tempPassCache.maxEl.date !== null &&
        this._satelliteService.isOverSiderealDay()
      ) {
        // AOSが見つからない、かつ、軌道周期が1恒星日以上の場合は常に可視のためLOSの探索をしない
        this._isVisible = VisibilityType.ALWAYS_VISIBLE;
        // 前回周期の日時を元に最大仰角を探索する
        tempPassCache.maxEl = this._prepareBinarySearchMaxElevationArgs(
          tempPassCache.maxEl.date,
          tempPassCache.maxEl.elevation
        );
        // キャッシュ配列を初期化して、仰角を格納する
        this._passesClear();
        this._addPassToCache({
          aos: null,
          maxEl: { date: tempPassCache.maxEl.date, elevation: tempPassCache.maxEl.elevation },
          los: null,
        });
        return null;
      }
    }

    for (let i = 0; i <= searchEndMin; i += searchMinStep) {
      // i分後の日時を取得する
      const searchDate = new Date(startTime + i * Constant.Time.MILLISECONDS_IN_MINUTE);
      // 観測地点からの人工衛星の仰角を計算する
      const elevation = this._satelliteService.getSatelliteElevationAngle(searchDate, this._ecefLocation);
      if (!elevation) {
        // 人工衛星が消滅した場合は計算済み時間を更新してnullを返却する
        this._updateCalculatedTime(searchDate);
        return null;
      }

      if (elevation >= 0.0) {
        if (tempPassCache.aos?.date === null) {
          // 前回周期の日時を元にAOSを探索する
          tempPassCache.aos = this._binarySearchAosLos(
            new Date(searchDate.getTime() - searchMinStep * Constant.Time.MILLISECONDS_IN_MINUTE),
            searchDate,
            SearchType.AOS
          );
        }
        if (elevation > tempPassCache.maxEl.elevation) {
          // 前回周期で取得した仰角より大きい場合は最大仰角を更新する
          tempPassCache.maxEl = { date: searchDate, elevation: elevation };
        }
      } else if (
        tempPassCache.aos?.date !== null &&
        tempPassCache.maxEl.date !== null &&
        tempPassCache.los?.date === null
      ) {
        // 前回周期の日時を元に最大仰角を探索する
        tempPassCache.maxEl = this._prepareBinarySearchMaxElevationArgs(
          tempPassCache.maxEl.date,
          tempPassCache.maxEl.elevation
        );
        if (this._validMinEl > tempPassCache.maxEl.elevation) {
          // 取得した最大仰角が有効な最低仰角より小さい場合は一時キャッシュを初期化して次のパスを探索する
          tempPassCache = this._initTempPassCache();
          continue;
        }
        // 前回周期の日時を元にLOSを探索する
        tempPassCache.los = this._binarySearchAosLos(
          new Date(searchDate.getTime() - searchMinStep * Constant.Time.MILLISECONDS_IN_MINUTE),
          searchDate,
          SearchType.LOS
        );
        if (tempPassCache.los?.date) {
          // AOS/LOS/Melの一時キャッシュをキャッシュ配列に追加する
          this._addPassToCache(tempPassCache);
          if (
            endTime === null ||
            (endTime !== null && (endTime - startTime) / Constant.Time.MILLISECONDS_IN_MINUTE < i)
          ) {
            // 指定した日時から最も近い有効なパスを取得した、または、探索終了日時まで到達した場合は終了する
            // 一時キャッシュを初期化する
            tempPassCache = this._initTempPassCache();
            // 計算済み時間を更新する
            this._updateCalculatedTime(searchDate);
            return searchDate.getTime();
          }
          // 一時キャッシュを初期化する
          tempPassCache = this._initTempPassCache();
        } else {
          // AOS/LOS/Melの計算結果が揃わなかった場合は一時キャッシュを初期化して次のパスを探索する
          tempPassCache = this._initTempPassCache();
          continue;
        }
      }
      // 計算済み時間を更新する
      this._updateCalculatedTime(searchDate);
      // パス探索時の周期ステップ数を取得する
      searchMinStep = this._getSearchMinStep(elevation);
    }
    if (this._passesCache.length === 0 && this._satelliteService.isOverSiderealDay()) {
      // AOS/LOSが見つからない、かつ、軌道周期が1恒星日以上の場合は常に不可視のため探索処理を中断する
      this._isVisible = VisibilityType.ALWAYS_INVISIBLE;
      // キャッシュ配列を初期化する
      this._passesClear();
      return null;
    }
    return new Date(startTime + searchEndMin * Constant.Time.MILLISECONDS_IN_MINUTE).getTime();
  };

  /**
   * パスの一時キャッシュの初期化データを返却する
   * @returns パスの一時キャッシュの初期化データ
   */
  private _initTempPassCache = (): TempPassCache => {
    return {
      aos: { date: null, elevation: 0.0 },
      maxEl: { date: null, elevation: 0.0 },
      los: { date: null, elevation: 0.0 },
    };
  };

  /**
   * 計算済み終端時間を初期化する
   */
  private _initCalculatedTime = () => {
    if (this._operationStartUtcDate) {
      // 運用開始日時が設定された場合は現在日時を運用開始日時とする
      this._calculatedTime = this._operationStartUtcDate.getTime();
    } else {
      this._calculatedTime = new Date().getTime();
    }
  };

  /**
   * 計算済み終端時間を更新する
   * @param {Date} updateDate 更新時間
   */
  private _updateCalculatedTime = (updateDate: Date) => {
    if (this._calculatedTime < updateDate.getTime()) {
      // 更新時間が計算済み終端時間の未来時間の場合は更新する
      this._calculatedTime = updateDate.getTime();
    }
  };

  /**
   * パス探索時の周期ステップ数を取得する
   * @param elevation 仰角[単位:度]
   * @returns ステップ[単位:分]
   */
  protected _getSearchMinStep = (elevation: number) => {
    if (Math.abs(elevation) <= 2.0) {
      // 仰角が2度以下の場合は1分間隔で探索を行う
      return 1;
    } else {
      if (elevation > 0.0) {
        // 仰角が2度より大きい場合はlog4の床関数に相当する間隔で探索を行う
        return Math.floor(Math.log2(elevation)) / 2;
      } else {
        // 仰角が-2度より小さい場合はlog2の床関数に相当する間隔で探索を行う
        return Math.floor(Math.log2(Math.abs(elevation)));
      }
    }
  };

  /**
   * 取得済みパスを初期化する
   */
  private _passesClear() {
    // AOS/LOS/Melのキャッシュ配列を初期化
    this._passesCache = [];
    // 未探索日時区間配列を初期化
    this._unexploredTime = [];
    // 計算済み時間を初期化
    this._initCalculatedTime();
  }

  /**
   * 未探索日時区間配列に日時期間を追加する
   * @param {number} startTime 日時期間(開始)
   * @param {number} endTime 日時期間(終了)
   */
  private _addUnexploredTime = (startTime: number, endTime: number) => {
    // 現在日時を取得する
    let nowTime = new Date().getTime();
    if (this._operationStartUtcDate) {
      // 運用開始日時が設定された場合は現在日時を運用開始日時とする
      nowTime = this._operationStartUtcDate.getTime();
    }
    if (startTime < nowTime) {
      // 日時期間(開始)が過去日時の場合は現在日時に設定する
      startTime = nowTime;
    }
    if (endTime <= nowTime) {
      // 日時期間(終了)が過去日時の場合は終了する
      return;
    }
    // 未探索日時区間配列に日時期間を追加する
    this._unexploredTime.push({ startTime: startTime, endTime: endTime });
  };

  /**
   * AOS/LOS/Melをキャッシュ配列に追加する
   * @param {TempPassCache} tempPassCache AOS/LOS/Melのキャッシュ
   */
  private _addPassToCache = (tempPassCache: TempPassCache) => {
    if (this._isVisible === VisibilityType.VISIBLE) {
      if (!tempPassCache.aos?.date || !tempPassCache.maxEl.date || !tempPassCache.los?.date) {
        // AOS/LOS/Melが揃っていない、または、AOS/LOS/Melが重複する場合は終了する
        return;
      }
      // 人工衛星が可視の場合の探索結果をキャッシュ配列に格納する
      this._passesCache.push({
        aos: this._setPassData(tempPassCache.aos?.date, tempPassCache.aos?.elevation),
        maxEl: this._setPassData(tempPassCache.maxEl.date, tempPassCache.maxEl.elevation),
        los: this._setPassData(tempPassCache.los?.date, tempPassCache.los?.elevation),
        durationMs: tempPassCache.los?.date.getTime() - tempPassCache.aos?.date.getTime(),
      });
    } else if (this._isVisible === VisibilityType.ALWAYS_VISIBLE) {
      // 人工衛星が常に可視の場合の探索結果をキャッシュ配列に格納する
      if (tempPassCache.maxEl.date) {
        this._passesCache.push({
          aos: null,
          maxEl: this._setPassData(tempPassCache.maxEl.date, tempPassCache.maxEl.elevation),
          los: null,
          durationMs: null,
        });
      }
    }
  };

  /**
   * キャッシュ配列に格納するパスデータを作成する
   * @param {Date} date 日時
   * @param {number} elevation 仰角[単位:度]
   * @returns {PassData} パスデータ
   */
  protected _setPassData = (date: Date, elevation: number): PassData => {
    // 日時から人工衛星の位置を取得する
    const targetLocation = date ? this._satelliteService.getTargetPolarLocationInRadian(date) : null;
    return targetLocation
      ? {
          date: date,
          lookAngles: {
            azimuth: this._satelliteService.getAzimuthAngle(
              this._ecefLocation,
              targetLocation.latitude,
              targetLocation.longitude
            ),
            elevation: elevation,
          },
          satLocation: targetLocation,
        }
      : null; // 人工衛星が消滅した場合はnullを返却する
  };

  /**
   * 二分探索でAOS/LOSを探索する
   * @param {Date} startDate 探索開始時間
   * @param {Date} endDate 探索終了時間
   * @param {SearchType} searchType 可視時間の探索種別
   * @returns {(TempPassData | null)} AOSの時間/仰角[単位:度]
   */
  private _binarySearchAosLos = (startDate: Date, endDate: Date, searchType: SearchType): TempPassData | null => {
    const elevationStart = this._satelliteService.getSatelliteElevationAngle(startDate, this._ecefLocation);
    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const elevationMid = this._satelliteService.getSatelliteElevationAngle(midDate, this._ecefLocation);
    if (elevationStart && elevationMid) {
      if (Math.abs(startDate.getTime() - endDate.getTime()) < 100) {
        // 探索範囲が0.1秒以内になったら終了する
        if (Math.trunc(elevationStart) === 0) {
          return { date: startDate, elevation: elevationStart };
        } else {
          return { date: null, elevation: 0.0 };
        }
      } else if (searchType === SearchType.AOS && elevationStart <= 0.0 && elevationMid > 0.0) {
        // AOSを探索する
        return this._binarySearchAosLos(startDate, midDate, searchType);
      } else if (searchType === SearchType.LOS && elevationStart >= 0.0 && elevationMid < 0.0) {
        // LOSを探索する
        return this._binarySearchAosLos(startDate, midDate, searchType);
      } else {
        // 探索範囲を後半に変更する
        return this._binarySearchAosLos(midDate, endDate, searchType);
      }
    }
    // 人工衛星が消滅した場合はnullを返却する
    return { date: null, elevation: 0.0 };
  };

  /**
   * 二分探索で最大仰角を求めるために必要な引数を作成する
   * @param {Date} midDate 探索時間のピボット
   * @param {number} elevationMid ピボット時間での仰角[単位:度]
   * @returns {TempPassData} Melの時間/仰角[単位:度]
   */
  protected _prepareBinarySearchMaxElevationArgs = (midDate: Date, elevationMid: number): TempPassData => {
    // 二分探索で最大仰角を求める
    return this._binarySearchMaxElevation(
      new Date(midDate.getTime() - (this._getSearchMinStep(elevationMid) * Constant.Time.MILLISECONDS_IN_MINUTE) / 2),
      midDate,
      elevationMid,
      new Date(midDate.getTime() + (this._getSearchMinStep(elevationMid) * Constant.Time.MILLISECONDS_IN_MINUTE) / 2)
    );
  };

  /**
   * 二分探索で最大仰角を求める
   * @param {Date} startDate 探索開始時間
   * @param {Date} midDate 探索時間のピボット
   * @param {(number | null)} elevationMid ピボット時間での仰角[単位:度]
   * @param {Date} endDate 探索終了時間
   * @returns {TempPassData} Melの時間/仰角[単位:度]
   */
  private _binarySearchMaxElevation = (
    startDate: Date,
    midDate: Date,
    elevationMid: number | null,
    endDate: Date
  ): TempPassData => {
    const elevationStart = this._satelliteService.getSatelliteElevationAngle(startDate, this._ecefLocation);
    const elevationEnd = this._satelliteService.getSatelliteElevationAngle(endDate, this._ecefLocation);
    if (elevationStart && elevationMid && elevationEnd) {
      const dateDiff = Math.abs(startDate.getTime() - endDate.getTime());
      if (dateDiff < 100) {
        // 探索範囲が0.1秒以内になったら終了
        return { date: midDate, elevation: elevationMid };
      } else if (elevationMid < elevationStart) {
        // 探索範囲を前半にする
        return this._binarySearchMaxElevation(
          new Date(startDate.getTime() - dateDiff / 4),
          startDate,
          elevationStart,
          new Date(startDate.getTime() + dateDiff / 4)
        );
      } else if (elevationMid < elevationEnd) {
        // 探索範囲を後半にする
        return this._binarySearchMaxElevation(
          new Date(endDate.getTime() - dateDiff / 4),
          endDate,
          elevationEnd,
          new Date(endDate.getTime() + dateDiff / 4)
        );
      } else {
        // 探索範囲を中央のまま半分にする
        return this._binarySearchMaxElevation(
          new Date(midDate.getTime() - dateDiff / 4),
          midDate,
          elevationMid,
          new Date(midDate.getTime() + dateDiff / 4)
        );
      }
    }
    // 人工衛星が消滅した場合はnullを返却する
    return { date: null, elevation: 0.0 };
  };
}

export default GroundStationService;
