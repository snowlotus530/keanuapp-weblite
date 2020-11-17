<template>
  <div>
    <div class="messageOut">
      <div class="sender">{{ "You" }}</div>
      <div class="bubble">
        <div class="message">{{ event.getContent().body }}</div>
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
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>