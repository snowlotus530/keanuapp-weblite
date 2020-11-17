<template>
  <!-- Contact left the chat -->
  <div
    class="messageJoin"
    v-if="
      event.event.state_key != myUserId &&
      event.getContent().membership == 'leave' &&
      event.getType() == 'm.room.member'
    "
  >
    {{ stateEventDisplayName(event) }} left the chat
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>