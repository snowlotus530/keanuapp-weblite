<template>
  <div class="messageOut">
    <div class="bubble">
      <div class="message">
        {{ event.getContent().body }}
        <span class="edit-marker" v-if="event.replacingEventId()"
          >(edited)</span
        >
      </div>
      <QuickReactions :event="event" :reactions="reactions" />
    </div>
    <v-btn icon class="op-button" @click.stop="showContextMenu"
      ><v-icon>more_vert</v-icon></v-btn
    >
    <!-- <div class="sender">{{ "You" }}</div> -->
    <div class="time">
      {{ formatTime(event.event.origin_server_ts) }}
    </div>
    <div class="status">{{ event.status }}</div>
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