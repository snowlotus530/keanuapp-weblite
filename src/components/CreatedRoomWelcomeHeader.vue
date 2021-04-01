<template>
  <div class="created-room-welcome-header">
    <div class="h4">Welcome!</div>
    <div class="mt-2">Here are a few things to know about your group:</div>
    <div class="mt-2" v-if="roomJoinRule == 'public'">Anyone can join by opening this link: {{ publicRoomLink }}</div>
    <div class="mt-2" v-else-if="roomJoinRule == 'invite'">Only people you invite can join.</div>
    <div class="mt-2">You can change 'join permissions' and 'message history' at any time in the group settings.</div>
    <div class="text-right">
      <v-btn text @click.stop="$emit('close')">Got it</v-btn>
    </div>
  </div>
</template>

<script>
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "CreatedRoomWelcomeHeader",
  mixins: [roomInfoMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>