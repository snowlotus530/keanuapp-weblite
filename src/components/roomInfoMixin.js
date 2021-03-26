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
      if (this.room) {
        const joinRules = this.room.currentState.getStateEvents(
          "m.room.join_rules",
          ""
        );
        return joinRules && joinRules.getContent().join_rule;
      }
      return null;
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