<template>
  <!-- Contact invited to the chat -->
  <div class="messageJoin">
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