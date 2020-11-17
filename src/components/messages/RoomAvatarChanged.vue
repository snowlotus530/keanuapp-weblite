<template>
  <!-- ROOM AVATAR CHANGED -->
  <div class="statusEvent">
    {{ stateEventDisplayName(event) }} changed the room avatar
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