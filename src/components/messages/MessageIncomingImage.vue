<template>
  <div>
    <div class="messageIn">
      <div class="sender">{{ messageEventDisplayName(event) }}</div>
      <div class="bubble image-bubble">
        <v-img :aspect-ratio="16 / 9" ref="image" :src="src" cover />
      </div>
      <v-avatar class="avatar" size="40" color="grey">
        <img
          v-if="messageEventAvatar(event)"
          :src="messageEventAvatar(event)"
        />
        <span v-else class="white--text headline">{{
          messageEventDisplayName(event).substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>
    </div>
    <div class="time">
      {{ formatTime(event.event.origin_server_ts) }}
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";
//import axios from 'axios';
import util from "../../plugins/utils";

export default {
  mixins: [messageMixin],
  data() {
    return {
      src: null,
    };
  },
  mounted() {
    console.log("Mounted with event:", JSON.stringify(this.event.getContent()));
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