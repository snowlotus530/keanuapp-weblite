<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <div class="audio-bubble">
      <audio controls :src="src">Audio file</audio>
      <QuickReactions :event="event" :reactions="reactions" />
    </div>
    <div class="senderAndTime">
      <!-- <div class="sender">{{ "You" }}</div> -->
      <div class="time">
        {{ formatTime(event.event.origin_server_ts) }}
      </div>
      <div class="status">{{ event.status }}</div>
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