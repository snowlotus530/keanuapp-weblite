<template>
  <div class="created-room-welcome-header">
    <div>{{ $t("room_welcome.info") }}</div>
    <div class="mt-2" v-if="roomJoinRule == 'public'">
      <i18n path="room_welcome.join_public" tag="span">
        <template v-slot:link>
          <a :href="publicRoomLink">{{ publicRoomLink }}</a>
        </template>
      </i18n>
    </div>
    <div class="mt-2" v-else-if="roomJoinRule == 'invite'">
      {{ $t("room_welcome.join_invite") }}
    </div>
    <div class="mt-2">{{ $t("room_welcome.info_permissions") }}</div>
    <div class="mt-2" v-if="roomIsEncrypted">
      {{ $t("room_welcome.encrypted") }}
    </div>
    <div class="mt-2" v-if="roomHistoryDescription">
      {{ roomHistoryDescription }}
    </div>
    <div class="text-right">
      <v-btn text @click.stop="$emit('close')" style="text-transform: none">{{
        $t("room_welcome.got_it")
      }}</v-btn>
    </div>
  </div>
</template>

<script>
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "CreatedRoomWelcomeHeader",
  mixins: [roomInfoMixin],
  computed: {
    roomHistoryDescription() {
      const visibility = this.$matrix.getRoomHistoryVisibility(this.room);
      switch (visibility) {
        case "world_readable":
          return this.$t("room_welcome.room_history_is", {
            type: this.$t("message.room_history_world_readable"),
          });
        case "shared":
          return this.$t("room_welcome.room_history_is", {
            type: this.$t("message.room_history_shared"),
          });
        case "invited":
          return this.$t("room_welcome.room_history_is", {
            type: this.$t("message.room_history_invited"),
          });
        case "joined":
          return this.$t("room_welcome.room_history_joined");
      }
      return null;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>