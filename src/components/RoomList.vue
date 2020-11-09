<template>
  <v-list flat>
    <v-subheader>ROOMS</v-subheader>
    <v-list-item-group v-model="currentRoomId" color="primary">
      <v-list-item v-for="room in $matrix.rooms" :key="room.roomId" :value="room.roomId">
        <v-list-item-icon>
          <v-icon v-text="room.icon"></v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            v-text="room.summary.info.title"
          ></v-list-item-title>
          <v-list-item-content
            >Topic: {{ room.topic }}</v-list-item-content
          >
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
export default {
  name: "RoomList",

  data: () => ({
    currentRoomId: -1,
  }),

  watch: {
    currentRoomId() {
      this.$matrix.setCurrentRoomId(this.currentRoomId);
    },
  },
};
</script>
