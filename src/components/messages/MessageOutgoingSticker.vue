<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <div class="bubble sticker-bubble">
      <v-img :aspect-ratio="16 / 9" ref="image" :src="src" :cover="cover" :contain="contain" />
      <QuickReactions :event="event" :reactions="reactions" />
    </div>
    <v-avatar class="avatar" size="32" color="#ededed" @click.stop="ownAvatarClicked">
      <img v-if="userAvatar" :src="userAvatar" />
      <span v-else class="white--text headline">{{ userAvatarLetter }}</span>
    </v-avatar>
    <div class="senderAndTime">
      <!-- <div class="sender">{{ "You" }}</div> -->
      <div class="time">
        {{ formatTime(event.event.origin_server_ts) }}
        <div class="status">{{ event.status }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";
import stickers from "../../plugins/stickers";

export default {
  mixins: [messageMixin],
  data() {
    return {
      src: null,
      cover: false,
      contain: true,
    };
  },
  mounted() {
    this.src = stickers.getStickerImage(this.event.getContent().body)
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>