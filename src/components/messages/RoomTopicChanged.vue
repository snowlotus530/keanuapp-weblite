<template>
  <!-- ROOM TOPIC CHANGED -->
  <div class="statusEvent">
    {{ $t('message.user_changed_room_topic', {user: stateEventDisplayName(event), topic: event.getContent().topic}) }}
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