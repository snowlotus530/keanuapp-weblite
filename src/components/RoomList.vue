<template>
  <v-list dense>
    <v-subheader>ROOMS</v-subheader>
    <v-list-item-group v-model="currentRoomId" color="primary">
      <v-list-item v-for="room in $matrix.rooms" :key="room.roomId" :value="room.roomId">
        <v-list-item-avatar>
          <v-img :src="room.avatar" />
        </v-list-item-avatar>
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
    currentRoomId: -1,
  }),

  watch: {
    currentRoomId() {
      this.$emit("close");
      this.$navigation.push({name: 'Chat', params: { roomId: util.sanitizeRoomId(this.currentRoomId) }}, -1);
    },
  },
};
</script>
