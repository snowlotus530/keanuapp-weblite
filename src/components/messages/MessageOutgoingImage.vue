<template>
  <div class="messageOut">
    <div class="op-button" ref="opbutton">
      <v-btn icon @click.stop="showContextMenu($refs.opbutton)"
        ><v-icon>more_vert</v-icon></v-btn
      >
    </div>
    <div class="bubble image-bubble">
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
import util from "../../plugins/utils";

export default {
  mixins: [messageMixin],
  data() {
    return {
      src: null,
      cover: true,
      contain: false,
    };
  },
  mounted() {
    const width = this.$refs.image.$el.clientWidth;
    const height = (width * 9) / 16;
    util
      .getThumbnail(this.$matrix.matrixClient, this.event, width, height)
      .then((url) => {
        const info = this.event.getContent().info;
        // JPEGs use cover, PNG and GIF ect contain. This is because PNG and GIF are expected to
        // be stickers and small emoji type things.
        if (info && info.mimetype && info.mimetype.startsWith("image/jp")) {
          this.cover = true;
          this.contain = false;
        } else {
          this.cover = false;
          this.contain = true;
        }
        this.src = url;
      })
      .catch((err) => {
        console.log("Failed to fetch thumbnail: ", err);
      });
  },
  beforeDestroy() {
    if (this.src) {
      const objectUrl = this.src;
      this.src = null;
      URL.revokeObjectURL(objectUrl);
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>