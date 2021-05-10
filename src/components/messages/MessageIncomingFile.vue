<template>
  <message-incoming v-bind="{...$props, ...$attrs}" v-on="$listeners">
    <div class="bubble">
      <div class="original-message" v-if="inReplyToText">
        <div class="original-message-sender">
          {{ inReplyToSender || "Someone" }} said:
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
          >(edited)</span
        >
      </div>
    </div>
  </message-incoming>
</template>

<script>
import MessageIncoming from "./MessageIncoming.vue";

export default {
  extends: MessageIncoming,
  components: { MessageIncoming }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>