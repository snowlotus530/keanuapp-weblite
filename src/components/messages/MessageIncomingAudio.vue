<template>
  <message-incoming v-bind="{...$props, ...$attrs}">
    <div class="audio-bubble">
      <audio controls :src="src">Audio file</audio>
    </div>
  </message-incoming>
</template>

<script>
import attachmentMixin from "./attachmentMixin";
import MessageIncoming from './MessageIncoming.vue';

export default {
  extends: MessageIncoming,
  mixins: [attachmentMixin],
  components: { MessageIncoming }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>