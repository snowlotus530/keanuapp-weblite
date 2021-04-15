<template>
  <BottomSheet ref="sheet" class="sticker-picker">
    <v-tabs
      v-model="currentStickerPack"
      centered
      class="tabs"
      show-arrows
    >
      <v-tabs-slider></v-tabs-slider>

      <v-tab v-for="pack in packs" :key="pack">
        {{ pack }}
        <v-icon>mdi-phone</v-icon>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="currentStickerPack" class="tab-items">
      <v-tab-item v-for="pack in packs" :key="pack">
        <v-card flat>
          <v-container fluid>
            <v-row>
              <v-col cols="2" v-for="sticker in stickersInPack(pack)" :key="pack + sticker.name">
                <v-img @click="selectSticker(pack, sticker)" :src="sticker.image" contain />
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </BottomSheet>
</template>

<script>
import BottomSheet from "./BottomSheet";
import stickers from '../plugins/stickers';

export default {
  components: {
    BottomSheet,
  },
  data() {
    return {
      currentStickerPack: 'tab-0',
    };
  },
  computed: {
    packs() {
      return stickers.getPacks();
    }
  },
  mounted() {},
  methods: {
    open() {
      this.$refs.sheet.open();
    },
    stickersInPack(pack) {
      return stickers.stickersInPack(pack);
    },
    selectSticker(pack, sticker) {
      this.$refs.sheet.close();
      this.$emit('selectSticker', stickers.getStickerShortcode(pack, sticker));
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>

<style lang="scss">
.sticker-picker .tabs {
  position: sticky;
  top: 0px;
  z-index: 1;
}
</style>