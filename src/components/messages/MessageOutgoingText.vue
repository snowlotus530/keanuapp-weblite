<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <div class="bubble">
      <QuickReactions :event="event" :reactions="reactions" />
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">
          {{ inReplyToSender || "Someone" }} said:
        </div>
        <div class="original-message-text" v-html="linkify($sanitize(inReplyToText))" />
      </div>

      <div class="message">
        <span v-html="linkify($sanitize(messageText))" />
        <span class="edit-marker" v-if="event.replacingEventId()"
          >(edited)</span
        >
      </div>
    </div>
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