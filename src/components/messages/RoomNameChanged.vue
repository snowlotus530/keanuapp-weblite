<template>
  <!-- ROOM NAME CHANGED -->
  <div class="statusEvent">
    {{ stateEventDisplayName(event) }} changed room name to
    {{ event.getContent().name }}
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