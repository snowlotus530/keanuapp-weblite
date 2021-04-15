<template>
  <div :class="messageClasses">
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>
    <div class="bubble sticker-bubble">
      <v-img :aspect-ratio="16 / 9" ref="image" :src="src" :cover="cover" :contain="contain" />
      <QuickReactions :event="event" :reactions="reactions" />
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
    //console.log("Mounted with event:", JSON.stringify(this.event.getContent()));
    this.src = stickers.getStickerImage(this.event.getContent().body)
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>