<template>
  <div class="statusEvent">
    {{ $t('message.user_created_room', {user: stateEventDisplayName(event)}) }}
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