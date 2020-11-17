<template>
  <div>
    <div class="messageOut">
      <div class="sender">{{ "You" }}</div>
      <div class="bubble">
        <v-img :aspect-ratio="16/9" ref="image" :src="src" contain />
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
    this.src = this.$matrix.matrixClient.mxcUrlToHttp(this.event.getContent().url, width, height, 'scale', false);
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>