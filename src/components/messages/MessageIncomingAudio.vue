<template>
  <message-incoming v-bind="{...$props, ...$attrs}" v-on="$listeners">
    <div class="bubble audio-bubble">
      <audio-player :src="src">Audio file</audio-player>
    </div>
  </message-incoming>
</template>

<script>
import attachmentMixin from "./attachmentMixin";
import MessageIncoming from './MessageIncoming.vue';
import AudioPlayer from './AudioPlayer.vue';

export default {
  extends: MessageIncoming,
  mixins: [attachmentMixin],
  components: { MessageIncoming, AudioPlayer }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>