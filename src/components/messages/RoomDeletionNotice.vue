<template>
  <!-- ROOM WILL BE DELETED -->
  <div class="notice">
    👋&nbsp;
    {{
      $t("purge_room.room_deletion_notice", {
        user: stateEventDisplayName(event),
      })
    }}
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