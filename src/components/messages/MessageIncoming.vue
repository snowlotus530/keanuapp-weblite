<template>
  <!-- BASE CLASS FOR INCOMING MESSAGE -->
  <div :class="messageClasses">
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>
    <QuickReactions :event="event" :reactions="reactions" />
    <!-- SLOT FOR CONTENT -->
    <slot></slot>
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