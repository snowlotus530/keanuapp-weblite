<template>
  <div class="messageIn">
    <div class="audio-bubble">
      <audio controls :src="src">Audio file</audio>
      <QuickReactions :event="event" :reactions="reactions" />
    </div>
    <v-btn icon class="op-button" @click.stop="showContextMenu"
      ><v-icon>more_vert</v-icon></v-btn
    >
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>
    <div class="sender">{{ messageEventDisplayName(event) }}</div>
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