<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }" v-on="$listeners">
    <div class="audio-bubble">
      <audio-player :src="src">{{ $t('fallbacks.audio_file')}}</audio-player>
    </div>
  </message-outgoing>
</template>

<script>
import attachmentMixin from "./attachmentMixin";
import AudioPlayer from './AudioPlayer.vue';
import MessageOutgoing from "./MessageOutgoing.vue";

export default {
  extends: MessageOutgoing,
  components: { MessageOutgoing, AudioPlayer },
  mixins: [attachmentMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>