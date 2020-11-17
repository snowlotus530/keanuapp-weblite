<template>
  <!-- Contact left the chat -->
  <div class="messageJoin">
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