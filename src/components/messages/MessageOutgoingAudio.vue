<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }">
    <div class="audio-bubble">
      <audio controls :src="src">Audio file</audio>
    </div>
  </message-outgoing>
</template>

<script>
import attachmentMixin from "./attachmentMixin";
import MessageOutgoing from "./MessageOutgoing.vue";

export default {
  extends: MessageOutgoing,
  components: { MessageOutgoing },
  mixins: [attachmentMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>