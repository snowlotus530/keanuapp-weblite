<template>
  <!-- Contact invited to the chat -->
  <div
    class="messageJoin"
    v-if="
      event.event.state_key != myUserId &&
      event.getContent().membership == 'invite' &&
      event.getType() == 'm.room.member'
    "
  >
    {{ stateEventDisplayName(event) }} was invited to the chat...
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