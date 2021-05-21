<template>
  <!-- ROOM AVATAR CHANGED -->
  <div class="statusEvent">
    {{ $t('message.user_changed_room_history',{user: stateEventDisplayName(event), type: history(event)}) }}
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  methods: {
    history(event) {
      const visibility = event.getContent().history_visibility;
      switch (visibility) {
        case "world_readable":
          return this.$t('message.room_history_world_readable');
        case "shared":
          return this.$t('message.room_history_shared');
        case "invited":
          return this.$t('message.room_history_invited');
        case "joined":
          return this.$t('message.room_history_joined');
      }
      return visibility;
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>