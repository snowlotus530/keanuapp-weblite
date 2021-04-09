
export default {
  computed: {
    isEditable() {
      return !this.incoming && this.event.getContent().msgtype == "m.text";
    },
    isDownloadable() {
      const msgtype = this.event.getContent().msgtype;
      return ['m.video','m.audio','m.image','m.file'].includes(msgtype);
    },
    isRedactable() {
      const room = this.$matrix.matrixClient.getRoom(this.event.getRoomId());
      if (room && room.currentState && room.currentState.maySendRedactionForEvent(this.event, this.$matrix.currentUserId)) {
        return true;
      }
      return false;
    }
  },
  methods: {
    addReaction() {
      this.$emit("close");
      this.$emit("addreaction", {event:this.event});
    },
    addQuickReaction(emoji) {
      this.$emit("close");
      this.$emit("addquickreaction", {event:this.event,emoji:emoji});
    },
    addReply() {
      this.$emit("close");
      this.$emit("addreply", {event:this.event});
    },
    edit() {
      this.$emit("close");
      this.$emit("edit", {event:this.event});
    },
    redact() {
      this.$emit("close");
      this.$emit("redact", {event:this.event});
    },
    download() {
      this.$emit("close");
      this.$emit("download", {event:this.event});
    },
    more() {
      this.$emit("close");
      this.$emit("more", {event:this.event});
    },
  }
}