/**
 * 衛星情報編集フォーム
 */
export default class EditSatelliteInfoForm {
  public satelliteId: number = -1;
  // 表示用衛星名
  public refSatelliteName: string = "";
  // 編集用衛星名
  public editSatelliteName: string = "";
  public noradId: string = "";
  public autoModeUplinkFreq: string = "1";
  public uplink1Mhz: number | null = null;
  public uplink1Mode: string = "";
  public uplink2Mhz: number | null = null;
  public uplink2Mode: string = "";
  public uplink3Mhz: number | null = null;
  public uplink3Mode: string = "";
  public autoModeDownlinkFreq: string = "1";
  public downlink1Mhz: number | null = null;
  public downlink1Mode: string = "";
  public downlink2Mhz: number | null = null;
  public downlink2Mode: string = "";
  public downlink3Mhz: number | null = null;
  public downlink3Mode: string = "";
  public toneHz: number | null = null;
  public beaconMhz: number | null = null;
  public beaconMode: string = "";
  public enableSatelliteMode: boolean = false;
  public satelliteMode: string = "1";
  public outline: string = "";
}
