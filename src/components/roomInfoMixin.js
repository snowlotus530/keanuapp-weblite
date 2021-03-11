export default {
  computed: {
    room() {
      return this.$matrix.currentRoom;
    },

    roomName() {
      if (this.room) {
        return this.room.name;
      }
      return "";
    },

    roomTopic() {
      if (this.room) {
        return this.room.topic;
      }
      return "";
    },

    roomAvatar() {
      if (this.room) {
        return this.room.avatar;
      }
      return "";
    },
  },
}