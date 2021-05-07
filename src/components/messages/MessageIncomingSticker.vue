<template>
  <message-incoming v-bind="{ ...$props, ...$attrs }">
    <div class="bubble sticker-bubble">
      <v-img
        :aspect-ratio="16 / 9"
        ref="image"
        :src="src"
        :cover="cover"
        :contain="contain"
      />
    </div>
  </message-incoming>
</template>

<script>
import stickers from "../../plugins/stickers";
import MessageIncoming from "./MessageIncoming.vue";

export default {
  extends: MessageIncoming,
  components: { MessageIncoming },
  data() {
    return {
      src: null,
      cover: false,
      contain: true,
    };
  },
  mounted() {
    //console.log("Mounted with event:", JSON.stringify(this.event.getContent()));
    this.src = stickers.getStickerImage(this.event.getContent().body);
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>