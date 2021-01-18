<template>
  <div :class="messageClasses">
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>

    <div class="bubble">
      <QuickReactions :event="event" :reactions="reactions" />
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">
          {{ inReplyToSender || "Someone" }} said:
        </div>
        <div class="original-message-text">{{ inReplyToText }}</div>
      </div>
      <div class="message">
        {{ messageText }}
        <span class="edit-marker" v-if="event.replacingEventId()"
          >(edited)</span
        >
      </div>
      <!-- <div>{{ JSON.stringify(event) }}</div> -->
    </div>
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <div v-if="showSenderAndTime" class="senderAndTime">
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