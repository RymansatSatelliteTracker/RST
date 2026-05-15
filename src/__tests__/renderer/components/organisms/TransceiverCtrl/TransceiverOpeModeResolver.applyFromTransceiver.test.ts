import Constant from "@/common/Constant";
import I18nMsgs from "@/common/I18nMsgs";
import { ApiResponse } from "@/common/types/types";
import I18nUtil from "@/renderer/common/util/I18nUtil";
import TransceiverOpeModeResolver, {
  OpeModeResolverState,
} from "@/renderer/components/organisms/TransceiverCtrl/TransceiverOpeModeResolver";
import emitter from "@/renderer/util/EventBus";
import { ref } from "vue";

const createState = (): OpeModeResolverState => ({
  txOpeMode: ref(Constant.Transceiver.OpeMode.UNSET),
  rxOpeMode: ref(Constant.Transceiver.OpeMode.UNSET),
});

describe("TransceiverOpeModeResolver.applyFromTransceiver", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("受信失敗時は通知してTx/Rx運用モードをUNSETに戻すこと", () => {
    const state = createState();
    state.txOpeMode.value = Constant.Transceiver.OpeMode.FM;
    state.rxOpeMode.value = Constant.Transceiver.OpeMode.FM;
    const resolver = new TransceiverOpeModeResolver(state);
    jest.spyOn(I18nUtil, "getMsg").mockReturnValue("mocked notice");
    const emitSpy = jest.spyOn(emitter, "emit").mockImplementation(() => {});
    const res = {
      status: false,
      message: I18nMsgs.SERIAL_NOT_CONNECTED_TRANSCEIVER,
      data: null,
    } as ApiResponse<any>;

    resolver.applyFromTransceiver(res);

    expect(state.txOpeMode.value).toBe(Constant.Transceiver.OpeMode.UNSET);
    expect(state.rxOpeMode.value).toBe(Constant.Transceiver.OpeMode.UNSET);
    expect(emitSpy).toHaveBeenCalledWith(Constant.GlobalEvent.NOTICE_ERR, expect.any(String));
  });

  it("アップリンク運用モード受信時はTx運用モードを更新すること", () => {
    const state = createState();
    const resolver = new TransceiverOpeModeResolver(state);
    const res = {
      status: true,
      data: {
        uplinkMode: Constant.Transceiver.OpeMode.USB,
      },
    } as ApiResponse<any>;

    resolver.applyFromTransceiver(res);

    expect(state.txOpeMode.value).toBe(Constant.Transceiver.OpeMode.USB);
    expect(state.rxOpeMode.value).toBe(Constant.Transceiver.OpeMode.UNSET);
  });

  it("ダウンリンク運用モード受信時はRx運用モードを更新すること", () => {
    const state = createState();
    const resolver = new TransceiverOpeModeResolver(state);
    const res = {
      status: true,
      data: {
        downlinkMode: Constant.Transceiver.OpeMode.FM,
      },
    } as ApiResponse<any>;

    resolver.applyFromTransceiver(res);

    expect(state.txOpeMode.value).toBe(Constant.Transceiver.OpeMode.UNSET);
    expect(state.rxOpeMode.value).toBe(Constant.Transceiver.OpeMode.FM);
  });
});
