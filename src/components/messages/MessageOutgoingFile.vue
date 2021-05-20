<template>
  <message-outgoing v-bind="{ ...$props, ...$attrs }" v-on="$listeners">
    <div class="bubble">
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">
          {{ $t('message.user_said', {user: inReplyToSender || "Someone"}) }}
        </div>
        <div
          class="original-message-text"
          v-html="linkify($sanitize(inReplyToText))"
        />
      </div>

      <div class="message">
        <span>File: </span>
        <span
          style="cursor: pointer"
          @click.stop="$emit('download')"
          v-html="linkify($sanitize(messageText))"
        />
        <span class="edit-marker" v-if="event.replacingEventId()"
          >{{ $t('edited') }}</span
        >
      </div>
    </div>
  </message-outgoing>
</template>

<script>
import MessageOutgoing from "./MessageOutgoing.vue";

export default {
  extends: MessageOutgoing,
  components: { MessageOutgoing },
};
</script>
<style lang="scss">
@import "@/assets/css/chat.scss";
</style>