import Constant from "@/common/Constant.js";
import { InvalidArgumentError } from "@/common/exceptions.js";
import { AppConfigTransceiver } from "@/common/model/AppConfigModel.js";
import { AppConfigTransceiverDevice } from "@/common/model/AppConfigTransceiverModel.js";
import TransceiverControllerFactory from "@/main/service/transceiver/controller/TransceiverControllerFactory.js";
import TransceiverIcomController from "@/main/service/transceiver/controller/TransceiverIcomController.js";
import TransceiverYaesuController from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuController.js";
import TransceiverYaesuFt897Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt897Protocol.js";
import TransceiverYaesuFt991Protocol from "@/main/service/transceiver/controller/yaesu/TransceiverYaesuFt991Protocol.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/main/common/SerialComm.js", () => ({ default: vi.fn() }));
vi.mock("@/main/main.js", () => ({ fireIpcEvent: vi.fn(), getMainWindow: vi.fn() }));
vi.mock("@/main/util/AppMainLogger.js", () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/main/util/I18nUtil4Main.js", () => ({ default: { getMsg: vi.fn(() => "msg") } }));
const mockFindDevice = vi.hoisted(() => vi.fn());
vi.mock("@/main/util/AppConfigUtil.js", () => ({ AppConfigUtil: { findTransceiverDeviceById: mockFindDevice } }));

/**
 * 無線機設定を生成する
 */
function config(makerId: string, transceiverId: string): AppConfigTransceiver {
  const c = new AppConfigTransceiver();
  c.makerId = makerId;
  c.transceiverId = transceiverId;
  c.civAddress = "A2";
  c.port = "COM1";
  c.baudrateBps = "4800";
  c.autoTrackingIntervalSec = "1";
  return c;
}

/**
 * 無線機定義ファイルから取得される機種定義をモックする
 */
function mockDevice(stopBits?: 1 | 2) {
  const device = new AppConfigTransceiverDevice();
  device.stopBits = stopBits;
  mockFindDevice.mockReturnValue(device);
}

describe("TransceiverControllerFactory.getController", () => {
  beforeEach(() => {
    mockFindDevice.mockReset();
  });

  it("ICOMの場合は、ICOMのコントローラを返すこと", async () => {
    const controller = await TransceiverControllerFactory.getController(config(Constant.Transceiver.MakerId.ICOM, "2"));

    expect(controller).toBeInstanceOf(TransceiverIcomController);
  });

  it("YAESU FT-991の場合は、YAESUのコントローラを、FT-991用のCAT制御で返すこと", async () => {
    mockDevice(2);

    const controller = await TransceiverControllerFactory.getController(
      config(Constant.Transceiver.MakerId.YAESU, Constant.Transceiver.TransceiverId.YAESU_FT991)
    );

    expect(controller).toBeInstanceOf(TransceiverYaesuController);
    expect((controller as TransceiverYaesuController)["protocol"]).toBeInstanceOf(TransceiverYaesuFt991Protocol);
  });

  it("YAESU FT-897の場合は、YAESUのコントローラを、FT-897用のCAT制御で返すこと", async () => {
    mockDevice(2);

    const controller = await TransceiverControllerFactory.getController(
      config(Constant.Transceiver.MakerId.YAESU, Constant.Transceiver.TransceiverId.YAESU_FT897)
    );

    expect(controller).toBeInstanceOf(TransceiverYaesuController);
    expect((controller as TransceiverYaesuController)["protocol"]).toBeInstanceOf(TransceiverYaesuFt897Protocol);
  });

  it("YAESUのコントローラには、無線機定義ファイルのストップビットを渡すこと", async () => {
    mockDevice(2);

    const controller = await TransceiverControllerFactory.getController(
      config(Constant.Transceiver.MakerId.YAESU, Constant.Transceiver.TransceiverId.YAESU_FT991)
    );

    expect((controller as TransceiverYaesuController)["stopBits"]).toBe(2);
    expect(mockFindDevice).toHaveBeenCalledWith(
      Constant.Transceiver.MakerId.YAESU,
      Constant.Transceiver.TransceiverId.YAESU_FT991
    );
  });

  it("無線機定義ファイルにストップビットの指定がない場合は、1を渡すこと", async () => {
    mockDevice(undefined);

    const controller = await TransceiverControllerFactory.getController(
      config(Constant.Transceiver.MakerId.YAESU, Constant.Transceiver.TransceiverId.YAESU_FT897)
    );

    expect((controller as TransceiverYaesuController)["stopBits"]).toBe(1);
  });

  it("YAESUの未対応の機種（旧FT-847の設定など）の場合は、InvalidArgumentErrorとなること（機種定義は参照しない）", async () => {
    await expect(
      TransceiverControllerFactory.getController(config(Constant.Transceiver.MakerId.YAESU, "1"))
    ).rejects.toThrow(InvalidArgumentError);
    expect(mockFindDevice).not.toHaveBeenCalled();
  });

  it("YAESUで機種IDが空の場合も、InvalidArgumentErrorとなること", async () => {
    await expect(
      TransceiverControllerFactory.getController(config(Constant.Transceiver.MakerId.YAESU, ""))
    ).rejects.toThrow("無効な無線機機種が指定されました");
  });

  it('機種IDは、メーカー内でのみ一意であるため、ICOMの同じ機種ID（"2"はIC-9700）では、YAESUのコントローラにならないこと', async () => {
    const controller = await TransceiverControllerFactory.getController(config(Constant.Transceiver.MakerId.ICOM, "2"));

    expect(controller).not.toBeInstanceOf(TransceiverYaesuController);
  });

  it("未対応のメーカーの場合は、InvalidArgumentErrorとなること", async () => {
    await expect(TransceiverControllerFactory.getController(config("99", "1"))).rejects.toThrow(InvalidArgumentError);
    await expect(TransceiverControllerFactory.getController(config("", ""))).rejects.toThrow(InvalidArgumentError);
  });
});
