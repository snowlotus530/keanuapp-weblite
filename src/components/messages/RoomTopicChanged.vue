<template>
  <!-- ROOM TOPIC CHANGED -->
  <div class="statusEvent">
    {{ stateEventDisplayName(event) }} changed topic to
    {{ event.getContent().topic }}
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