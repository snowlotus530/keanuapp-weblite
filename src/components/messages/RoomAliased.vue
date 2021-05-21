<template>
  <div class="statusEvent">
    {{ $t('message.user_aliased_room', {user: stateEventDisplayName(event), alias: event.getContent().alias}) }}
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