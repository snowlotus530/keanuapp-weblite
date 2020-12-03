<template>
  <div :class="{'messageOperations':true,'incoming':incoming,'outgoing':!incoming}">
    <v-btn icon v-event:tap.self="(e) => { addReaction() }" class="ma-0 pa-0">
      <v-icon>mood</v-icon>
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

  methods: {
    addReaction() {
      this.$emit("addreaction", {event:this.event});
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>