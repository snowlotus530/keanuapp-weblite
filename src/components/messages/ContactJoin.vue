<template>
  <!-- Contact joined the chat -->
  <div class="messageJoin">
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