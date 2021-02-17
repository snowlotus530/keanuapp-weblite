<template>
  <v-list dense class="room-list">
    <v-subheader>ROOMS</v-subheader>
    <v-list-item-group v-model="currentRoomId" color="primary">
      <v-list-item v-for="room in $matrix.rooms" :key="room.roomId" :value="room.roomId">
        <v-list-item-avatar size="40" color="#e0e0e0">
          <v-img :src="room.avatar" />
        </v-list-item-avatar>
        <div class="room-list-notification-count">{{ notificationCount(room) }}</div>
        <v-list-item-content>
          <v-list-item-title>{{ room.summary.info.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ room.topic }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
import util from "../plugins/utils";

export default {
  name: "RoomList",

  data: () => ({
    currentRoomId: null,
  }),

  methods: {
    notificationCount(room) {
      return room.getUnreadNotificationCount('total') || 0;
    }
  },

  watch: {
    currentRoomId() {
      this.$emit("close");
      this.$navigation.push({name: 'Chat', params: { roomId: util.sanitizeRoomId(this.currentRoomId) }}, -1);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>