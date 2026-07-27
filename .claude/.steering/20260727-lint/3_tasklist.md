# 改修タスクリスト

対応方針（`2_design.md`）に従い、以下の順に対応する。各タスク完了後、該当ファイルに対して
`npm run test -- <FileName>` を実行し、テストが通ることを確認する。全タスク完了後に
`npm run lint` を再実行し、0件になっていることを確認する。

- [ ] 1. `src/__tests__/common/model/DefaultSatelliteModel.test.ts`（2件: 15:11, 79:11）
- [ ] 2. `src/__tests__/main/service/AppConfigSatelliteService.test.ts`（2件: 37:7, 37:52）
- [ ] 3. `src/__tests__/main/service/DefaultSatelliteService.test.ts`（1件: 55:35）
- [ ] 4. `src/__tests__/main/service/OmmService_migrateFromTleJsonIfNeeded.test.ts`（4件: 49:31, 50:31, 51:31, 52:31）
- [ ] 5. `src/__tests__/main/util/AppConfigUtil.test.ts`（9件: 10:7, 10:39, 41:5, 41:12, 41:30, 41:35, 58:11, 59:20, 60:20）
- [ ] 6. `src/__tests__/main/validator/AppConfigValidator_exec.test.ts`（3件: 29:9, 69:9, 89:9）
- [ ] 7. `src/__tests__/main/validator/FrequencyValidator_exec.test.ts`（4件: 13:9, 31:9, 59:9, 81:9）
- [ ] 8. `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedRxFreq.test.ts`（2件: 32:73, 38:12）
- [ ] 9. `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcBaseFreqByShiftedTxFreq.test.ts`（2件: 32:73, 38:12）
- [ ] 10. `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcNewRxFreqWithDoppler.test.ts`（2件: 26:73, 28:12）
- [ ] 11. `src/__tests__/renderer/components/organisms/TransceiverCtrl/calculators/TransceiverDopplerCalc_calcNewTxFreqWithDoppler.test.ts`（4件: 26:73, 28:12, 39:73, 41:12）
- [ ] 12. `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverOpeModeResolver_applyFromTransceiver.test.ts`（6件: 31:22, 33:35, 48:22, 50:35, 64:22, 66:35）
- [ ] 13. `src/__tests__/renderer/components/organisms/TransceiverCtrl/resolvers/TransceiverRecvFreqResolver_applyFromTransceiver.test.ts`（6件: 42:41, 46:22, 66:41, 71:22, 96:41, 101:22）
- [ ] 14. `src/__tests__/renderer/service/FrequencyTrackService.test.ts`（1件: 55:25）
- [ ] 15. 全件修正後、`npm run lint` を再実行しエラー・警告が0件であることを確認
- [ ] 16. `npm run test` を実行し、全テストがパスすることを確認
