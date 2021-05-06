<template>
  <div :class="messageClasses">
    <v-avatar class="avatar" size="32" color="#ededed">
      <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
      <span v-else class="white--text headline">{{
        messageEventDisplayName(event).substring(0, 1).toUpperCase()
      }}</span>
    </v-avatar>
    <QuickReactions :event="event" :reactions="reactions" />
    <div class="bubble image-bubble">
      <v-responsive :aspect-ratio="16 / 9" :src="src">
        <video :src="src" controls style="width: 100%; height: 100%">
          Video file
        </video>
        <div v-if="downloadProgress" class="download-overlay">
          <div class="text-center download-text">
            {{ downloadProgress }}% downloaded
          </div>
        </div>
      </v-responsive>
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
import attachmentMixin from "./attachmentMixin";

export default {
  mixins: [messageMixin, attachmentMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>