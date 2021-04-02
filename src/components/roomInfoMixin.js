export default {
  data() {
    return {
      roomJoinRule: null,
      userCanChangeJoinRule: false
    }
  },
  mounted() {
    this.$matrix.on("Room.timeline", this.roomInfoMixinOnEvent);
    this.updatePermissions();
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.roomInfoMixinOnEvent);
  },

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

    publicRoomLink() {
      if (this.room && this.roomJoinRule == "public") {
        return this.$router.getRoomLink(
          this.room.getCanonicalAlias() || this.room.roomId
        );
      }
      return null;
    },
  },
  watch: {
    room: {
      handler(ignoredNewVal, ignoredOldVal) {
        this.updatePermissions();
      },
    },
    roomJoinRule: {
      handler(newVal, oldVal) {
        if (newVal && oldVal && newVal != oldVal) {
          this.setRoomJoinRule(newVal);
        }
      },
    },
  },
  methods: {
    getRoomJoinRule() {
      return this.$matrix.getRoomJoinRule(this.room);
    },

    updatePermissions() {
      if (this.room) {
        this.roomJoinRule = this.getRoomJoinRule();
        const canChangeAccess =
          this.room.currentState.mayClientSendStateEvent(
            "m.room.join_rules",
            this.$matrix.matrixClient
          ) &&
          this.room.currentState.mayClientSendStateEvent(
            "m.room.guest_access",
            this.$matrix.matrixClient
          );
        this.userCanChangeJoinRule = canChangeAccess;
      } else {
        this.roomJoinRule = null;
        this.userCanChangeJoinRule = false;
      }
    },

    roomInfoMixinOnEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      if (
        event.getType() == "m.room.join_rules" ||
        event.getType() == "m.room.guest_access"
      ) {
        this.updatePermissions();
      }
    },
  },
}