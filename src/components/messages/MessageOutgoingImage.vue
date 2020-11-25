<template>
  <div>
    <div class="messageOut">
      <div class="sender">{{ "You" }}</div>
      <div class="bubble image-bubble">
        <v-img :aspect-ratio="16/9" ref="image" :src="src" cover />
        <QuickReactions :event="event" :reactions="reactions" />
      </div>
      <div class="status">{{ event.status }}</div>
    </div>
    <div class="time">
      {{ formatTime(event.event.origin_server_ts) }}
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";
import util from "../../plugins/utils";

export default {
  mixins: [messageMixin],
  data() {
    return {
      src: null
    }
  },
  mounted() {
    const width = this.$refs.image.$el.clientWidth;
    const height = (width * 9) / 16;
    util
      .getThumbnail(this.$matrix.matrixClient, this.event, width, height)
      .then((url) => {
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