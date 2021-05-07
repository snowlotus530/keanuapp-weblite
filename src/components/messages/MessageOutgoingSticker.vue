<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }">
    <div class="bubble sticker-bubble">
      <v-img
        :aspect-ratio="16 / 9"
        ref="image"
        :src="src"
        :cover="cover"
        :contain="contain"
      />
    </div>
  </message-outgoing>
</template>

<script>
import stickers from "../../plugins/stickers";
import MessageOutgoing from "./MessageOutgoing.vue";

export default {
  extends: MessageOutgoing,
  components: { MessageOutgoing },
  data() {
    return {
      src: null,
      cover: false,
      contain: true,
    };
  },
  mounted() {
    this.src = stickers.getStickerImage(this.event.getContent().body);
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>