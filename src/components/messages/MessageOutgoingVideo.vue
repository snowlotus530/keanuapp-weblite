<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <QuickReactions :event="event" :reactions="reactions" />
    <div class="bubble image-bubble">
      <v-responsive :aspect-ratio="16 / 9" class="ma-0 pa-0">
        <video :src="src" controls style="width: 100%; height: 100%">
          Video file
        </video>
      </v-responsive>
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