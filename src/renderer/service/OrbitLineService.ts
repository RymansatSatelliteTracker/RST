import Constant from "@/common/Constant";
import { InvalidArgumentError } from "@/common/exceptions";
import type { OrbitLineCache } from "@/renderer/types/satellite-type";
import AppRendererLogger from "@/renderer/util/AppRendererLogger";
import type SatelliteService from "./SatelliteService";

/**
 * 人工衛星の軌道配列を作成する
 * @class OrbitLineService
 */
class OrbitLineService {
  // SatelliteServiceクラスの実体
  private _satelliteService: SatelliteService;
  // 軌道ピッチ[単位:分]
  private _orbitPitchMin: number;
  // ラップアラウンド判定(判定あり: true、判定なし: false)
  private _isWrapAround: boolean;
  // 地図の中心経度のオフセット
  private _offsetLongitude: number = 0.0;
  // 人工衛星の軌道キャッシュ配列
  private _orbitLinesCache: OrbitLineCache[] = [];

  /**
   * コンストラクタ
   * @constructor
   * @param {SatelliteService} satelliteService SatelliteServiceクラスの実体
   * @param {number} orbitPitchMin 軌道ピッチ[単位:分]
   * @param {boolean} [isWrapAround=true] ラップアラウンド判定(判定あり: true、判定なし: false)
   * @param {number} [offsetLongitude=0.0] 地図の中心経度のオフセット
   */
  constructor(
    satelliteService: SatelliteService,
    orbitPitchMin: number = 1,
    isWrapAround: boolean = true,
    offsetLongitude: number = 0.0
  ) {
    if (orbitPitchMin >= satelliteService.getOrbitalPeriodInMin()) {
      // コンストラクタの軌道ピッチが人工衛星の軌道周期以上の場合は例外をスローする
      AppRendererLogger.error("InvalidArgumentError: orbitPitchMin is out of range.");
      throw new InvalidArgumentError("orbitPitchMin is out of range.");
    }

    // SatelliteServiceクラスの実体を格納する
    this._satelliteService = satelliteService;
    // 軌道ピッチを設定する
    this._orbitPitchMin = orbitPitchMin;
    // ラップアラウンド判定を設定する
    this._isWrapAround = isWrapAround;
    // 地図の中心経度のオフセットを設定する
    this._offsetLongitude = offsetLongitude;
  }

  /**
   * 指定した日時を基準にして軌道配列を取得する
   * @param {Date} currentDate 軌道の基準日時
   * @param {Date[]} [splitDates=[]] 軌道分割する日時配列
   * @returns {Promise<{ resultOrbitLine: [number,number][][]; resultOrbitDashLine: [number,number][][] }>} 軌道配列
   */
  public getOrbitLineListAsync = async (
    currentDate: Date,
    splitDates: Date[] = []
  ): Promise<{ resultOrbitLine: [number, number][][]; resultOrbitDashLine: [number, number][][] }> => {
    if (this._satelliteService.isGeostationaryOrbit()) {
      // 人工衛星が静止衛星の場合は空配列を返却する
      return { resultOrbitLine: [], resultOrbitDashLine: [] };
    }

    // 軌道始端の日時を取得する
    const startDate = new Date(
      currentDate.getTime() -
        this._satelliteService.getOrbitalPeriodInMin() *
          Constant.OrbitCalculation.PAST_ORBIT_RATIO *
          Constant.Time.MILLISECONDS_IN_MINUTE
    );
    // 軌道終端の日時を取得する
    const endDate = new Date(
      currentDate.getTime() +
        this._satelliteService.getOrbitalPeriodInMin() *
          Constant.OrbitCalculation.FUTURE_ORBIT_RATIO *
          Constant.Time.MILLISECONDS_IN_MINUTE
    );
    // 軌道始端から軌道終端までの軌道キャッシュ配列を取得する
    return await this._getOrbitLineCachesAsync(startDate, endDate, splitDates);
  };

  /**
   * 軌道始端から軌道終端までの軌道キャッシュ配列を取得する
   * @param {Date} startDate 軌道始端の日時
   * @param {Date} endDate 軌道終端の日時
   * @param {Date[]} splitDates 軌道分割する日時配列
   * @returns {Promise<{ resultOrbitLine: [number,number][][]; resultOrbitDashLine: [number,number][][] }>} 軌道キャッシュ配列
   */
  private _getOrbitLineCachesAsync = async (
    startDate: Date,
    endDate: Date,
    splitDates: Date[]
  ): Promise<{ resultOrbitLine: [number, number][][]; resultOrbitDashLine: [number, number][][] }> => {
    // 軌道始端の日時から1軌道ピッチ分を削った日時を取得する
    const startTime = startDate.getTime() + this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE;
    // 軌道終端の日時から1軌道ピッチ分を削った日時を取得する
    const endTime = endDate.getTime() - this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE;

    if (this._orbitLinesCache.length === 0) {
      // 初回実行時の場合は、指定した日時期間で人工衛星の軌道キャッシュ配列を更新する
      await this._updateOrbitLineListAsync(startTime, endTime);
    } else {
      // 2回目以降実行時の場合は、指定した日時期間の不足分の人工衛星の軌道キャッシュ配列を更新する
      this._orbitLinesCache = [...this._orbitLinesCache].filter(
        (cache) => startTime <= cache.time && cache.time <= endTime
      );

      if (this._orbitLinesCache.length === 0) {
        // 人工衛星の軌道キャッシュ配列が空になった場合は指定した日時期間の人工衛星の緯度/経度を取得する
        await this._updateOrbitLineListAsync(startTime, endTime);
      } else {
        // 人工衛星の軌道キャッシュ配列要素から一番過去の日時を取得する
        let earliestTime = Math.min(...this._orbitLinesCache.map((cache) => cache.time));
        // 人工衛星の軌道キャッシュ配列要素から一番未来の日時を取得する
        let latestTime = Math.max(...this._orbitLinesCache.map((cache) => cache.time));
        // 一番過去の日時から1軌道ピッチを引いた日時を取得する
        earliestTime -= this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE;
        // 一番未来の日時から1軌道ピッチを足した日時を取得する
        latestTime += this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE;

        if (
          startTime < earliestTime &&
          earliestTime - startTime >= this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE
        ) {
          // 人工衛星の軌道キャッシュ配列に存在しない過去日時期間の人工衛星の緯度/経度を取得する
          await this._updateOrbitLineListAsync(startTime, earliestTime);
        }
        if (
          latestTime < endTime &&
          endTime - latestTime >= this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE
        ) {
          // 人工衛星の軌道キャッシュ配列に存在しない未来日時期間の人工衛星の緯度/経度を取得する
          await this._updateOrbitLineListAsync(latestTime, endTime);
        }
      }
    }

    // 軌道配列の一時キャッシュを取得する
    let tempOrbitLinesCache = [[...this._orbitLinesCache]];
    // 軌道配列の一時キャッシュを取得日時で昇順ソートする
    tempOrbitLinesCache[0] = tempOrbitLinesCache[0].sort((a, b) => a.time - b.time);

    if (tempOrbitLinesCache[0].length !== 0) {
      // 人工衛星の軌道が大気圏再突入していない場合は、軌道始端の緯度/経度を取得して軌道配列の一時キャッシュの始端に追加する
      const startLocation = this._satelliteService.getTargetPolarLocationInDegree(startDate, this._offsetLongitude);
      if (startLocation) {
        const isReEntry = startLocation.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM;
        if (!isReEntry) {
          tempOrbitLinesCache[0].unshift({
            time: startDate.getTime(),
            isReEntry: isReEntry,
            targetPolarLocation: {
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
              height: startLocation.height,
              radius: startLocation.radius,
            },
          });
        }
      }

      // 人工衛星の軌道が大気圏再突入していない場合は、軌道終端の緯度/経度を取得して軌道配列の一時キャッシュの終端に追加する
      const endLocation = this._satelliteService.getTargetPolarLocationInDegree(endDate, this._offsetLongitude);
      if (endLocation) {
        const isReEntry = endLocation.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM;
        if (!isReEntry) {
          tempOrbitLinesCache[0].push({
            time: endDate.getTime(),
            isReEntry: isReEntry,
            targetPolarLocation: {
              latitude: endLocation.latitude,
              longitude: endLocation.longitude,
              height: endLocation.height,
              radius: endLocation.radius,
            },
          });
        }
      }
    }

    if (splitDates.length !== 0) {
      // 軌道分割する日時配列が存在する場合は軌道配列の一時キャッシュを指定した日時で分割する
      tempOrbitLinesCache = await this._splitDateOrbitLineAsync(tempOrbitLinesCache[0], splitDates);
    }
    // 人工衛星の軌道がラップアラウンドや大気圏再突入する場合は軌道配列の一時キャッシュを分割して返却する
    return await this._splitOrbitLineAsync(tempOrbitLinesCache);
  };

  /**
   * 軌道配列の一時キャッシュを指定した日時で分割する
   * @param {OrbitLineCache[]} tempOrbitLinesCache 軌道配列の一時キャッシュ
   * @param {Date[]} splitDates 軌道分割日時配列
   * @returns {Promise<OrbitLineCache[][]>} 分割された軌道配列の一時キャッシュ
   */
  private _splitDateOrbitLineAsync = async (
    tempOrbitLinesCache: OrbitLineCache[],
    splitDates: Date[]
  ): Promise<OrbitLineCache[][]> => {
    if (tempOrbitLinesCache.length === 0 || splitDates.length === 0) {
      // 対象の軌道分割日時配列が存在しない場合は終了する
      return [tempOrbitLinesCache];
    }

    // 対象の軌道分割日時配列を抽出する
    splitDates = [...splitDates].filter(
      (cache) =>
        tempOrbitLinesCache[0].time <= cache.getTime() &&
        cache.getTime() <= tempOrbitLinesCache[tempOrbitLinesCache.length - 1].time
    );
    // 軌道分割日時配列を昇順ソートする
    splitDates.sort((a, b) => a.getTime() - b.getTime());

    if (splitDates.length === 0) {
      // 対象の軌道分割日時配列が存在しない場合は終了する
      return [tempOrbitLinesCache];
    }

    const resultTempOrbitLine: OrbitLineCache[][] = [[]];
    for (let i = 0; i < tempOrbitLinesCache.length - 1; i++) {
      for (let j = 0; j < splitDates.length; j++) {
        const currentTime = tempOrbitLinesCache[i].time;
        const nextTime = tempOrbitLinesCache[i + 1].time;
        resultTempOrbitLine[resultTempOrbitLine.length - 1].push(tempOrbitLinesCache[i]);
        if (splitDates.length !== 0 && currentTime <= splitDates[j].getTime() && splitDates[j].getTime() < nextTime) {
          // 対象の軌道分割日時の人工衛星の緯度/経度を取得する
          const splitOrbitLine = this._satelliteService.getTargetPolarLocationInDegree(
            splitDates[j],
            this._offsetLongitude
          );
          if (!splitOrbitLine) {
            // 対象の軌道分割日時で人工衛星が消滅した場合は中断する
            break;
          }
          // 対象の軌道分割日時の人工衛星の緯度/経度を追加する
          resultTempOrbitLine[resultTempOrbitLine.length - 1].push({
            time: splitDates[j].getTime(),
            isReEntry: splitOrbitLine.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM,
            targetPolarLocation: {
              latitude: splitOrbitLine.latitude,
              longitude: splitOrbitLine.longitude,
              height: splitOrbitLine.height,
              radius: splitOrbitLine.radius,
            },
          });
          // 軌道配列を新規追加する
          resultTempOrbitLine.push([]);
          // 対象の軌道分割日時の人工衛星の緯度/経度を追加する
          resultTempOrbitLine[resultTempOrbitLine.length - 1].push({
            time: splitDates[j].getTime(),
            isReEntry: splitOrbitLine.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM,
            targetPolarLocation: {
              latitude: splitOrbitLine.latitude,
              longitude: splitOrbitLine.longitude,
              height: splitOrbitLine.height,
              radius: splitOrbitLine.radius,
            },
          });
        }
      }
    }
    // 軌道配列の一時キャッシュの終端要素を追加する
    resultTempOrbitLine[resultTempOrbitLine.length - 1].push(tempOrbitLinesCache[tempOrbitLinesCache.length - 1]);
    return resultTempOrbitLine;
  };

  /**
   * 人工衛星の軌道がラップアラウンドや大気圏再突入する場合は軌道配列の一時キャッシュを分割して返却する
   * @param {OrbitLineCache[][]} tempOrbitLinesCache 軌道配列の一時キャッシュ
   * @returns {Promise<{ resultOrbitLine: [number,number][][]; resultOrbitDashLine: [number,number][][] }>} 分割された軌道配列の一時キャッシュ
   */
  private _splitOrbitLineAsync = async (
    tempOrbitLinesCache: OrbitLineCache[][]
  ): Promise<{ resultOrbitLine: [number, number][][]; resultOrbitDashLine: [number, number][][] }> => {
    // 実線表示の軌道配列
    const resultOrbitLine: [number, number][][] = [[]];
    // 点線表示の軌道配列
    const resultOrbitDashLine: [number, number][][] = [[]];
    for (let i = 0; i < tempOrbitLinesCache.length; i++) {
      for (let j = 0; j < tempOrbitLinesCache[i].length - 1; j++) {
        // 緯度を取得する
        const currentLatitude = tempOrbitLinesCache[i][j].targetPolarLocation.latitude;
        // 経度を取得する
        const currentLongitude = tempOrbitLinesCache[i][j].targetPolarLocation.longitude;
        // 大気圏再突入判定を取得する
        const isReEntry = tempOrbitLinesCache[i][j].isReEntry;
        // 大気圏再突入した場合は点線表示の軌道配列に格納して、それ以外の場合は実線表示の軌道配列に格納する
        const targetOrbitLine = isReEntry ? resultOrbitDashLine : resultOrbitLine;
        // 人工衛星の軌道配列に緯度/経度を追加する
        targetOrbitLine[targetOrbitLine.length - 1].push([currentLatitude, currentLongitude]);

        if (this._isWrapAround) {
          const nextLongitude = tempOrbitLinesCache[i][j + 1].targetPolarLocation.longitude;
          const longitudeDiff = Math.abs(nextLongitude - currentLongitude);
          if (longitudeDiff > 180.0) {
            // 人工衛星の軌道がラップアラウンドした時点の緯度/経度を取得する
            const boundaryOrbitLine = this._binarySearchBoundaryLocation(
              tempOrbitLinesCache[i][j].time,
              tempOrbitLinesCache[i][j + 1].time
            );
            if (!boundaryOrbitLine) {
              // 人工衛星が消滅した場合は中断する
              break;
            }
            if (currentLongitude < nextLongitude) {
              // 0度から360度へラップアラウンドした場合
              // 軌道がラップアラウンドする直前の緯度/経度を追加する
              targetOrbitLine[targetOrbitLine.length - 1].push([
                boundaryOrbitLine.targetPolarLocation.latitude,
                this._offsetLongitude,
              ]);
              // 軌道がラップアラウンドした場合は軌道配列を新規追加する
              if (resultOrbitDashLine[resultOrbitDashLine.length - 1].length !== 0) {
                resultOrbitDashLine.push([]);
              }
              if (resultOrbitLine[resultOrbitLine.length - 1].length !== 0) {
                resultOrbitLine.push([]);
              }
              // 軌道がラップアラウンドした直後の緯度/経度を追加する
              targetOrbitLine[targetOrbitLine.length - 1].push([
                boundaryOrbitLine.targetPolarLocation.latitude,
                360.0 + this._offsetLongitude,
              ]);
            } else {
              // 360度から0度へラップアラウンドした場合
              // 軌道がラップアラウンドする直前の緯度/経度を追加する
              targetOrbitLine[targetOrbitLine.length - 1].push([
                boundaryOrbitLine.targetPolarLocation.latitude,
                360.0 + this._offsetLongitude,
              ]);
              // 軌道がラップアラウンドした場合は軌道配列を新規追加する
              if (resultOrbitDashLine[resultOrbitDashLine.length - 1].length !== 0) {
                resultOrbitDashLine.push([]);
              }
              if (resultOrbitLine[resultOrbitLine.length - 1].length !== 0) {
                resultOrbitLine.push([]);
              }
              // 軌道がラップアラウンドした直後の緯度/経度を追加する
              targetOrbitLine[targetOrbitLine.length - 1].push([
                boundaryOrbitLine.targetPolarLocation.latitude,
                this._offsetLongitude,
              ]);
            }
          }
        }
        if (
          Math.abs(tempOrbitLinesCache[i][j + 1].time - tempOrbitLinesCache[i][j].time) >
          2 * this._orbitPitchMin * Constant.Time.MILLISECONDS_IN_MINUTE
        ) {
          // 人工衛星の軌道が消滅した部分を分割する
          if (resultOrbitDashLine[resultOrbitDashLine.length - 1].length !== 0) {
            resultOrbitDashLine.push([]);
          }
          if (resultOrbitLine[resultOrbitLine.length - 1].length !== 0) {
            resultOrbitLine.push([]);
          }
        }

        if (!isReEntry && tempOrbitLinesCache[i][j + 1].isReEntry === true) {
          // 人工衛星の軌道で大気圏再突入した軌道を分割する
          if (resultOrbitDashLine[resultOrbitDashLine.length - 1].length !== 0) {
            resultOrbitDashLine.push([]);
          }
          if (resultOrbitLine[resultOrbitLine.length - 1].length !== 0) {
            resultOrbitLine.push([]);
          }
          // 人工衛星の軌道で大気圏再突入した直後の緯度/経度を追加する
          resultOrbitDashLine[resultOrbitDashLine.length - 1].push([
            tempOrbitLinesCache[i][j].targetPolarLocation.latitude,
            tempOrbitLinesCache[i][j].targetPolarLocation.longitude,
          ]);
        } else if (isReEntry && tempOrbitLinesCache[i][j + 1].isReEntry === false) {
          // 人工衛星の軌道で大気圏再突入から復活した場合は直前の緯度/経度を追加する
          resultOrbitDashLine[resultOrbitDashLine.length - 1].push([
            tempOrbitLinesCache[i][j + 1].targetPolarLocation.latitude,
            tempOrbitLinesCache[i][j + 1].targetPolarLocation.longitude,
          ]);
          // 人工衛星の軌道で大気圏再突入から復活した軌道を分割する
          if (resultOrbitDashLine[resultOrbitDashLine.length - 1].length !== 0) {
            resultOrbitDashLine.push([]);
          }
          if (resultOrbitLine[resultOrbitLine.length - 1].length !== 0) {
            resultOrbitLine.push([]);
          }
        }
      }
      if (
        tempOrbitLinesCache[i] &&
        tempOrbitLinesCache[i].length > 0 &&
        tempOrbitLinesCache[i][tempOrbitLinesCache[i].length - 1].targetPolarLocation
      ) {
        if (tempOrbitLinesCache[i][tempOrbitLinesCache.length - 1].isReEntry) {
          // 人工衛星が大気圏再突入した場合は点線表示の軌道配列に追加する
          resultOrbitDashLine[resultOrbitDashLine.length - 1].push([
            tempOrbitLinesCache[i][tempOrbitLinesCache[i].length - 1].targetPolarLocation.latitude,
            tempOrbitLinesCache[i][tempOrbitLinesCache[i].length - 1].targetPolarLocation.longitude,
          ]);
        } else {
          // 人工衛星が大気圏再突入していない場合は実線表示の軌道配列に追加する
          resultOrbitLine[resultOrbitLine.length - 1].push([
            tempOrbitLinesCache[i][tempOrbitLinesCache[i].length - 1].targetPolarLocation.latitude,
            tempOrbitLinesCache[i][tempOrbitLinesCache[i].length - 1].targetPolarLocation.longitude,
          ]);
        }
      }
      if (i !== tempOrbitLinesCache.length - 1) {
        // 軌道配列の一時キャッシュの終端要素の場合は軌道配列を新規追加する
        resultOrbitDashLine.push([]);
        resultOrbitLine.push([]);
      }
    }
    return { resultOrbitLine, resultOrbitDashLine };
  };

  /**
   * 二分探索で人工衛星の軌道がラップアラウンドする境界の緯度/経度を探索する
   * @param {number} startTime 探索開始日時
   * @param {number} endTime 探索終了日時
   * @returns {(OrbitLineCache | null)} 人工衛星の軌道がラップアラウンドする境界の緯度/経度
   */
  private _binarySearchBoundaryLocation = (startTime: number, endTime: number): OrbitLineCache | null => {
    const startLocation = this._satelliteService.getTargetPolarLocationInDegree(
      new Date(startTime),
      this._offsetLongitude
    );
    const midTime = (startTime + endTime) / 2;
    const midLocation = this._satelliteService.getTargetPolarLocationInDegree(new Date(midTime), this._offsetLongitude);
    if (!startLocation || !midLocation) {
      // 人工衛星が消滅した場合はnullを返却する
      return null;
    }

    if (Math.abs(startTime - endTime) < 100) {
      // 探索範囲が0.1秒以内になったら終了する
      return {
        time: startTime,
        isReEntry: startLocation.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM,
        targetPolarLocation: {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          height: startLocation.height,
          radius: startLocation.radius,
        },
      };
    } else if (Math.abs(startLocation.longitude - midLocation.longitude) > 180.0) {
      // ラップアラウンドする境界の緯度/経度を探索する
      return this._binarySearchBoundaryLocation(startTime, midTime);
    } else {
      // 探索範囲を後半に変更する
      return this._binarySearchBoundaryLocation(midTime, endTime);
    }
  };

  /**
   * 指定した日時期間の人工衛星の緯度/経度を取得してキャッシュ配列に格納する
   * @param {number} startTime 探索開始日時
   * @param {number} endTime 探索終了日時
   */
  private _updateOrbitLineListAsync = async (startTime: number, endTime: number) => {
    // 探索終了日時を設定する
    const searchEndMin = (endTime - startTime) / Constant.Time.MILLISECONDS_IN_MINUTE;
    for (let i = 0; i <= searchEndMin; i += this._orbitPitchMin) {
      // i分後の日時を取得する
      const searchDate = new Date(startTime + i * Constant.Time.MILLISECONDS_IN_MINUTE);
      // i分後の人工衛星の座標を取得する
      const location = this._satelliteService.getTargetPolarLocationInDegree(searchDate, this._offsetLongitude);
      if (!location) {
        // 人工衛星が消滅した場合は中断する
        break;
      }

      // 軌道キャッシュ配列に格納する
      this._orbitLinesCache.push({
        time: searchDate.getTime(),
        isReEntry: location.height <= Constant.OrbitCalculation.REENTRY_ALTITUDE_KM,
        targetPolarLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          height: location.height,
          radius: location.radius,
        },
      });
    }
  };
}

export default OrbitLineService;
