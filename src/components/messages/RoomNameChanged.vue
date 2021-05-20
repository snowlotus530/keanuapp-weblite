<template>
  <!-- ROOM NAME CHANGED -->
  <div class="statusEvent">
    {{ $t('message.user_changed_room_name', {user: stateEventDisplayName(event), name: event.getContent().name}) }}
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