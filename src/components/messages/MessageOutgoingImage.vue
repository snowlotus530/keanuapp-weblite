<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }" v-on="$listeners">
    <div class="bubble image-bubble">
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
import util from "../../plugins/utils";
import MessageOutgoing from "./MessageOutgoing.vue";

export default {
  extends: MessageOutgoing,
  components: { MessageOutgoing },
  data() {
    return {
      src: null,
      cover: true,
      contain: false,
    };
  },
  mounted() {
    const width = this.$refs.image.$el.clientWidth;
    const height = (width * 9) / 16;
    util
      .getThumbnail(this.$matrix.matrixClient, this.event, width, height)
      .then((url) => {
        const info = this.event.getContent().info;
        // JPEGs use cover, PNG and GIF ect contain. This is because PNG and GIF are expected to
        // be stickers and small emoji type things.
        if (info && info.mimetype && info.mimetype.startsWith("image/jp")) {
          this.cover = true;
          this.contain = false;
        } else {
          this.cover = false;
          this.contain = true;
        }
        this.src = url;
      })
      .catch((err) => {
        console.log("Failed to fetch thumbnail: ", err);
      });
  },
  beforeDestroy() {
    if (this.src) {
      const objectUrl = this.src;
      this.src = null;
      URL.revokeObjectURL(objectUrl);
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>