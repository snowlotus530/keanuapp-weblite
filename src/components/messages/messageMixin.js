export default {
  props: {
    room: {
      type: Object,
      default: function () {
        return null
      }
    },
    event: {
      type: Object,
      default: function () {
        return {}
      }
    },
  },
  computed: {
  },
  methods: {
    /**
     * Get a display name given an event.
     */
    stateEventDisplayName(event) {
      if (this.room) {
        const member = this.room.getMember(event.getSender());
        if (member) {
          return member.name;
        }
      }
      return event.getContent().displayname || event.event.state_key;
    },

    messageEventDisplayName(event) {
      return this.stateEventDisplayName(event);
    },

    messageEventAvatar(event) {
      if (this.room) {
        const member = this.room.getMember(event.getSender());
        if (member) {
          return member.getAvatarUrl(
            this.$matrix.matrixClient.getHomeserverUrl(),
            40,
            40,
            "scale",
            true
          );
        }
      }
      return null;
    },

    formatTime(time) {
      const date = new Date();
      date.setTime(time);

      const today = new Date();
      if (
        date.getDate() == today.getDate() &&
        date.getMonth() == today.getMonth() &&
        date.getFullYear() == today.getFullYear()
      ) {
        // For today, skip the date part
        return date.toLocaleTimeString();
      }
      return date.toLocaleString();
    },
  }
}