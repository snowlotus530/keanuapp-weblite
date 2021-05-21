<template>
  <div class="created-room-welcome-header">
    <div class="h4">{{$t('room_welcome.welcome')}}</div>
    <div class="mt-2">{{$t('room_welcome.info')}}</div>
    <div class="mt-2" v-if="roomJoinRule == 'public'">{{$t('room_welcome.join_public', {link: publicRoomLink}) }}</div>
    <div class="mt-2" v-else-if="roomJoinRule == 'invite'">{{$t('room_welcome.join_invite')}}</div>
    <div class="mt-2">{{$t('room_welcome.info_permissions')}}</div>
    <div class="text-right">
      <v-btn text @click.stop="$emit('close')">{{$t('room_welcome.got_it')}}</v-btn>
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