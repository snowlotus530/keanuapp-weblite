<template>
  <!-- Contact joined the chat -->
  <div class="messageJoin">
    {{ $t('message.user_joined',{user: stateEventDisplayName(event)}) }}
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