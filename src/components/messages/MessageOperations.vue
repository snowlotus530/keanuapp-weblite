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
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>