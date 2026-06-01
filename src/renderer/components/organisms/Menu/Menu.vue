<template>
  <div class="menu">
    <!-- 衛星設定 -->
    <div class="menu__item" @mouseleave="onLeftSatellite" @click="showSatSetting">
      <img src="/src/renderer/assets/sat.png" class="menu__item__icon" @mouseover="onHoveredSatellite" />
      <Transition name="fade">
        <span v-show="hoveredSatellite" class="menu__item__text">{{ I18nUtil.getMsg(I18nMsgs.GCOM_SATELLITE) }}</span>
      </Transition>
    </div>
    <SatelliteSetting
      v-if="enableSatelliteSetting"
      v-model:is-show="enableSatelliteSetting"
      @on-ok="onCloseSatelliteSetting"
      @on-cancel="onCloseSatelliteSetting"
    />

    <!-- 無線機設定 -->
    <div class="menu__item" @mouseleave="onLeftTransceiver" @click="showTransceiverSetting">
      <img src="/src/renderer/assets/radio.png" class="menu__item__icon" @mouseover="onHoveredTransceiver" />
      <transition name="fade">
        <span v-show="hoveredTransceiver" class="menu__item__text">{{ I18nUtil.getMsg(I18nMsgs.GCOM_RADIO) }}</span>
      </transition>
    </div>
    <TransceiverSetting
      v-model:is-show="enableTransceiverSetting"
      persistent
      @on-ok="onCloseTransceiverSetting"
      @on-cancel="onCloseTransceiverSetting"
    />

    <!-- ローテータ設定 -->
    <div class="menu__item" @mouseleave="onLeftRotator" @click="showRotatorSetting">
      <img src="/src/renderer/assets/antenna.png" class="menu__item__icon" @mouseover="onHoveredRotator" />
      <transition name="fade">
        <span v-show="hoveredRotator" class="menu__item__text">{{ I18nUtil.getMsg(I18nMsgs.GCOM_ROTATOR) }}</span>
      </transition>
    </div>
    <RotatorSetting
      v-model:is-show="enableRotatorSetting"
      persistent
      @on-ok="onCloseRotatorSetting"
      @on-cancel="onCloseRotatorSetting"
    />

    <!-- 地上局設定 -->
    <div class="menu__item" @mouseleave="onLeftGroundStation" @click="showGroundStationSetting">
      <img src="/src/renderer/assets/earth.png" class="menu__item__icon" @mouseover="onHoveredGroundStation" />
      <transition name="fade">
        <span v-show="hoveredGroundStation" class="menu__item__text">{{
          I18nUtil.getMsg(I18nMsgs.GCOM_GROUND_STATION)
        }}</span>
      </transition>
    </div>
    <GroundStationSetting
      v-model:is-show="enableGroundStationSetting"
      persistent
      @on-ok="onGroundStationSetting"
      @on-cancel="onGroundStationSetting"
    />
  </div>
</template>

<script setup lang="ts">
import I18nMsgs from "@/common/I18nMsgs.js";
import I18nUtil from "@/renderer/common/util/I18nUtil.js";
import GroundStationSetting from "@/renderer/components/organisms/setting/GroundStationSetting/GroundStationSetting.vue";
import RotatorSetting from "@/renderer/components/organisms/setting/RotatorSetting/RotatorSetting.vue";
import SatelliteSetting from "@/renderer/components/organisms/setting/SatelliteSetting/SatelliteSetting.vue";
import TransceiverSetting from "@/renderer/components/organisms/setting/TransceiverSetting/TransceiverSetting.vue";
import { ref } from "vue";

// 制御系
const enableSatelliteSetting = ref(false);
const enableTransceiverSetting = ref(false);
const enableRotatorSetting = ref(false);
const enableGroundStationSetting = ref(false);
const hoveredSatellite = ref(false);
const hoveredTransceiver = ref(false);
const hoveredRotator = ref(false);
const hoveredGroundStation = ref(false);

/**
 * 衛星設定画面を表示する
 */
function showSatSetting() {
  enableSatelliteSetting.value = true;
}

/**
 * 衛星設定画面が閉じられた
 */
function onCloseSatelliteSetting() {
  enableSatelliteSetting.value = false;
}

/**
 * 無線機設定画面を表示する
 */
function showTransceiverSetting() {
  enableTransceiverSetting.value = true;
}

/**
 * 無線機設定画面が閉じられた
 */
function onCloseTransceiverSetting() {
  enableTransceiverSetting.value = false;
}

/**
 * ローテータ設定画面を表示する
 */
function showRotatorSetting() {
  enableRotatorSetting.value = true;
}

/**
 * ローテータ設定画面が閉じられた
 */
function onCloseRotatorSetting() {
  enableRotatorSetting.value = false;
}

/**
 * 地上局設定画面を表示する
 */
function showGroundStationSetting() {
  enableGroundStationSetting.value = true;
}

/**
 * 地上局設定画面が閉じられた
 */
function onGroundStationSetting() {
  enableGroundStationSetting.value = false;
}

/**
 * 衛星アイコンがマウスオーバーされた
 */
function onHoveredSatellite() {
  hoveredSatellite.value = true;
}

/**
 * 無線アイコンがマウスオーバーされていない
 */
function onLeftSatellite() {
  hoveredSatellite.value = false;
}

/**
 * 無線アイコンがマウスオーバーされた
 */
function onHoveredTransceiver() {
  hoveredTransceiver.value = true;
}

/**
 * 衛星アイコンがマウスオーバーされていない
 */
function onLeftTransceiver() {
  hoveredTransceiver.value = false;
}

/**
 * ローテータアイコンがマウスオーバーされた
 */
function onHoveredRotator() {
  hoveredRotator.value = true;
}

/**
 * ローテータアイコンがマウスオーバーされていない
 */
function onLeftRotator() {
  hoveredRotator.value = false;
}
/**
 * 地上局アイコンがマウスオーバーされた
 */
function onHoveredGroundStation() {
  hoveredGroundStation.value = true;
}

/**
 * 地上局アイコンがマウスオーバーされていない
 */
function onLeftGroundStation() {
  hoveredGroundStation.value = false;
}
</script>

<style lang="scss" scoped>
@use "./Menu" as *;
</style>
