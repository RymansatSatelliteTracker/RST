import type { TargetPolarLocation } from "@/renderer/types/satellite-type";

// AOS/LOS/Melのキャッシュ
export type PassData = { date: Date; lookAngles: LookAngles; satLocation: TargetPolarLocation } | null;
export type PassesCache = {
  aos: PassData;
  maxEl: PassData;
  los: PassData;
  durationMs: number | null;
};

// 仰角/方位角
export type LookAngles = {
  elevation: number;
  azimuth: number;
};

// AOS/LOS/Melの一時キャッシュ
export type TempPassData = { date: Date | null; elevation: number };
export type TempPassCache = {
  aos: TempPassData | null;
  maxEl: TempPassData;
  los: TempPassData | null;
};

// 日時区間
export type TimeInterval = {
  startTime: number;
  endTime: number;
};
