<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <QuickReactions :event="event" :reactions="reactions" />
    <div class="bubble">
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">
          {{ inReplyToSender || "Someone" }} said:
        </div>
        <div
          class="original-message-text"
          v-html="linkify($sanitize(inReplyToText))"
        />
      </div>

      <div class="message">
        <span>File: </span>
        <span
          style="cursor: pointer"
          @click.stop="$emit('download')"
          v-html="linkify($sanitize(messageText))"
        />
        <span class="edit-marker" v-if="event.replacingEventId()"
          >(edited)</span
        >
      </div>
    </div>
    <v-avatar
      class="avatar"
      size="32"
      color="#ededed"
      @click.stop="ownAvatarClicked"
    >
      <img v-if="userAvatar" :src="userAvatar" />
      <span v-else class="white--text headline">{{ userAvatarLetter }}</span>
    </v-avatar>
    <!-- <div class="sender">{{ "You" }}</div> -->
    <div class="senderAndTime">
      <div class="time">
        {{ formatTime(event.event.origin_server_ts) }}
      </div>
      <div class="status">{{ event.status }}</div>
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