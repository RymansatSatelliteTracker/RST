import { AppConfigModel, AppConfigSatellite } from "@/common/model/AppConfigModel";
import { AppConfigSatSettingModel } from "@/common/model/AppConfigSatelliteSettingModel";
import AppConfigSatelliteService from "@/main/service/AppConfigSatelliteService";
import { AppConfigUtil } from "@/main/util/AppConfigUtil";
/**
 * 正常系:transformSatelliteGroupsForSatSetting
 */
test("success_transformSatelliteGroupsForSatSetting", () => {
  // Arrange
  jest
    .spyOn(AppConfigSatelliteService.prototype, "getUserRegisteredAppConfigSatellite")
    .mockImplementation((arg: number) => {
      const appConfigSat = new AppConfigSatellite();
      appConfigSat.satelliteId = arg;
      appConfigSat.userRegisteredSatelliteName = "hoge";
      return appConfigSat;
    });

  const appConfig = new AppConfigModel();
  appConfig.satelliteGroups = [{ groupId: 1, groupName: "group", satelliteIds: [1] }];

  // Act
  const appConfigSatSet = AppConfigUtil.transformSatelliteGroupsForSatSetting(appConfig);

  // Assert
  expect(appConfigSatSet).toHaveProperty("satelliteGroupsForSatSetting");
  expect(appConfigSatSet.satelliteGroupsForSatSetting[0].satellites[0].satelliteName).toBe("hoge");
});

/**
 * 正常系:storeConfigSatSetting
 */
test("success_transformSatelliteGroups", () => {
  const appConfigSatSet = new AppConfigSatSettingModel();
  appConfigSatSet.satelliteGroupsForSatSetting = [
    { groupId: 1, groupName: "group", satellites: [{ satelliteId: 1, satelliteName: "hoge", userRegistered: false }] },
  ];
  const appConfig = AppConfigUtil.transformSatelliteGroups(appConfigSatSet);

  expect(appConfig.satelliteGroups[0].satelliteIds[0]).toBe(1);
});

/**
 * 正常系:copyMatchingProperties
 */
test("success_copyMatchingProperties", () => {
  const objectA = { update: "aaa", noChange: "bbb" };
  const objectB = { update: "ccc", notExsit: "ddd" };

  AppConfigUtil.copyMatchingProperties(objectA, objectB);

  expect(objectA.update).toBe("ccc");
  expect(objectA.noChange).toBe("bbb");
  expect(objectA).not.toHaveProperty("notExist");
});
