<template>
  <!-- BASE CLASS FOR OUTGOING MESSAGE -->
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <QuickReactions :event="event" :reactions="reactions" />
    <!-- SLOT FOR CONTENT -->
    <slot></slot>
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