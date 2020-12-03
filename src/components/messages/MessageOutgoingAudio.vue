<template>
  <div>
    <div class="messageOut">
      <div class="sender">{{ "You" }}</div>
      <div class="audio-bubble">
        <audio controls :src="src">Audio file</audio>
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
import attachmentMixin from "./attachmentMixin";

export default {
  mixins: [messageMixin, attachmentMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>