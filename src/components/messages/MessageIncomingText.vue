<template>
  <div class="messageIn">
      <v-avatar class="avatar" size="32" color="#ededed">
        <img
          v-if="messageEventAvatar(event)"
          :src="messageEventAvatar(event)"
        />
        <span v-else class="white--text headline">{{
          messageEventDisplayName(event).substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>

      <div class="bubble">
        <div class="message">{{ event.getContent().body }}
          <span class="edit-marker" v-if="event.replacingEventId()">(edited)</span>
        </div>
        <QuickReactions :event="event" :reactions="reactions" />
      </div>
      <div class="sender">{{ messageEventDisplayName(event) }}</div>
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