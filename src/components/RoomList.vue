<template>
  <v-list flat>
    <v-subheader>ROOMS</v-subheader>
    <v-list-item-group v-model="currentRoomIndex" color="primary">
      <v-list-item v-for="(room, i) in rooms" :key="i">
        <v-list-item-icon>
          <v-icon v-text="room.icon"></v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            v-text="room.summary.info.title"
          ></v-list-item-title>
          <v-list-item-content
            >Topic: {{ room.summary.info.desc }}</v-list-item-content
          >
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
    <v-btn @click="reloadRooms">Refresh</v-btn>
  </v-list>
</template>

<script>
export default {
  name: "RoomList",

  data: () => ({
    rooms: [],
    currentRoomIndex: -1,
  }),

  mounted() {
    this.reloadRooms();
    this.$matrixClient.on("Room.name", this.onRoomNameChanged);
    this.$matrixClient.on("event", this.onEvent);
  },

  destroyed() {
    this.$matrixClient.off("Room.name", this.onRoomNameChanged);
    this.$matrixClient.off("event", this.onEvent);
  },

  watch: {
    currentRoomIndex() {
      var currentRoom =
        this.currentRoomIndex >= 0 && this.currentRoomIndex < this.rooms.length
          ? this.rooms[this.currentRoomIndex]
          : null;
      this.$emit("onCurrentRoomChanged", currentRoom);
    },
  },

  methods: {
    onEvent(event) {
       if (event.getType() == "m.room.topic") {
           const room = this.rooms.find((r) => {
               return (r.roomId == event.getRoomId());
           })
           if (room) {
               room.summary.info.desc = event.getContent().topic;
           }
           return;
        }

      const allowedEvents = [
        "m.room.message"
      ];
      if (allowedEvents.includes(event.getType())) {
          // TODO - find "last message"...
      }
    },

    onRoomNameChanged(room) {
        console.log("New name for room: " + room.name);
    },

    reloadRooms() {
      var rooms = this.$matrixClient.getVisibleRooms();
      rooms.forEach((room) => {
        console.log("Room", room);
      });
      this.rooms = rooms;

      // Default to first room if available
      if (this.rooms.length > 0 && this.currentRoomIndex == -1) {
        this.currentRoomIndex = 0;
      } else if (this.rooms.length == 0) {
        this.currentRoomIndex = -1;
      }
    },
  },
};
</script>
