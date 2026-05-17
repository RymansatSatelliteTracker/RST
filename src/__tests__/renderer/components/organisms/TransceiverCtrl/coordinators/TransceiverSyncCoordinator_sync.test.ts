import Constant from "@/common/Constant";
import TransceiverSyncCoordinator, {
  SyncCoordinatorState,
} from "@/renderer/components/organisms/TransceiverCtrl/coordinators/TransceiverSyncCoordinator";
import { ref } from "vue";

const createState = (): SyncCoordinatorState => ({
  txFrequency: ref("2430.000.000"),
  rxFrequency: ref("0480.000.000"),
  txOpeMode: ref(Constant.Transceiver.OpeMode.FM),
  rxOpeMode: ref(Constant.Transceiver.OpeMode.AM),
});

describe("TransceiverSyncCoordinator", () => {
  it("syncRxFrequencyはサテライトモードOFF時にRx周波数を同期すること", () => {
    const state = createState();
    const coordinator = new TransceiverSyncCoordinator(state);

    coordinator.syncRxFrequency(Constant.Transceiver.SatelliteMode.UNSET, "145.900.000");

    expect(state.rxFrequency.value).toBe("145.900.000");
  });

  it("syncTxFrequencyはサテライトモードON時に同期しないこと", () => {
    const state = createState();
    const coordinator = new TransceiverSyncCoordinator(state);

    coordinator.syncTxFrequency(Constant.Transceiver.SatelliteMode.SATELLITE, "145.900.000");

    expect(state.txFrequency.value).toBe("2430.000.000");
  });

  it("syncRxOpeModeは同一値の場合に更新しないこと", () => {
    const state = createState();
    const coordinator = new TransceiverSyncCoordinator(state);

    coordinator.syncRxOpeMode(Constant.Transceiver.SatelliteMode.UNSET, Constant.Transceiver.OpeMode.AM);

    expect(state.rxOpeMode.value).toBe(Constant.Transceiver.OpeMode.AM);
  });

  it("syncTxOpeModeはサテライトモードOFF時にTx運用モードを同期すること", () => {
    const state = createState();
    const coordinator = new TransceiverSyncCoordinator(state);

    coordinator.syncTxOpeMode(Constant.Transceiver.SatelliteMode.UNSET, Constant.Transceiver.OpeMode.USB);

    expect(state.txOpeMode.value).toBe(Constant.Transceiver.OpeMode.USB);
  });
});
