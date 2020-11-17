<template>
  <!-- Contact joined the chat -->
  <div
    class="messageJoin"
    v-if="
      event.event.state_key != myUserId &&
      event.getContent().membership == 'join' &&
      event.getType() == 'm.room.member'
    "
  >
    {{ stateEventDisplayName(event) }} joined the chat
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