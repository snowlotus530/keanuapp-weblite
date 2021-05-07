<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }">
    <div class="bubble image-bubble">
      <v-responsive :aspect-ratio="16 / 9" class="ma-0 pa-0">
        <video :src="src" controls style="width: 100%; height: 100%">
          Video file
        </video>
      </v-responsive>
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