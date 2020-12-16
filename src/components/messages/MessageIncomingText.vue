<template>
  <div class="messageIn">
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>

    <div class="bubble">
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">{{ inReplyToSender || 'Someone' }} said:</div>
        <div class="original-message-text">{{ inReplyToText }}</div>
      </div>
      <div class="message">
        {{ messageText }}
        <span class="edit-marker" v-if="event.replacingEventId()"
          >(edited)</span
        >
      </div>
      <QuickReactions :event="event" :reactions="reactions" />
      <!-- <div>{{ JSON.stringify(event) }}</div> -->
    </div>
    <v-btn icon class="op-button" @click.stop="showContextMenu"
      ><v-icon>more_vert</v-icon></v-btn
    >
    <div v-if="showSenderAndTime">
      <div class="sender">{{ messageEventDisplayName(event) }}</div>
      <div class="time">
        {{ formatTime(event.event.origin_server_ts) }}
      </div>
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