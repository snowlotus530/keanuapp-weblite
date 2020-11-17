<template>
  <div>
    <div class="messageIn">
      <div class="sender">{{ messageEventDisplayName(event) }}</div>
      <v-avatar class="avatar" size="40" color="grey">
        <img
          v-if="messageEventAvatar(event)"
          :src="messageEventAvatar(event)"
        />
        <span v-else class="white--text headline">{{
          messageEventDisplayName(event).substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>

      <div class="bubble">
        <v-img :aspect-ratio="16 / 9" ref="image" :src="src" contain />
      </div>
    </div>
    <div class="time">
      {{ formatTime(event.event.origin_server_ts) }}
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  data() {
    return {
      src: null,
    };
  },
  mounted() {
    // const width = this.$refs.image.$el.clientWidth;
    // const height = (width * 9) / 16;
    const content = this.event.getContent();
    if (
      content &&
      content.info &&
      content.info.thumbnail_file &&
      content.info.thumbnail_file.url
    ) {
      this.src = this.$matrix.matrixClient.mxcUrlToHttp(
        content.info.thumbnail_file.url,
        content.info.w,
        content.info.h,
        "scale",
        true
      );
      console.log("SRC set to: ", this.src);
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>