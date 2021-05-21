<template>
  <!-- Contact invited to the chat -->
  <div class="messageJoin">
    {{ $t('message.user_was_invited', {user: event.getContent().displayname || stateEventDisplayName(event)}) }}
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