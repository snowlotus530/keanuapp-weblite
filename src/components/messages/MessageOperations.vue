<template>
  <div :class="{'message-operations':true,'incoming':incoming,'outgoing':!incoming}">
    <v-btn icon @click.stop="addReaction" class="ma-0 pa-0">
      <v-icon>mood</v-icon>
    </v-btn>
    <v-btn v-if="incoming" icon @click.stop="addReply" class="ma-0 pa-0">
      <v-icon>reply</v-icon>
    </v-btn>
    <v-btn v-if="isEditable" icon @click.stop="edit" class="ma-0 pa-0">
      <v-icon>edit</v-icon>
    </v-btn>
    <v-btn v-if="isRedactable" icon @click.stop="redact" class="ma-0 pa-0">
      <v-icon>delete</v-icon>
    </v-btn>
    <v-btn v-if="isDownloadable" icon @click.stop="download" class="ma-0 pa-0">
      <v-icon>get_app</v-icon>
    </v-btn>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],

  props: {
    incoming: {
      type: Boolean,
      default: function () {
        return true
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
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>