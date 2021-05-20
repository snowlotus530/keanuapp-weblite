<template>
  <div
    :class="{
      'avatar-operations': true,
      incoming: incoming,
      outgoing: !incoming,
    }"
  >
    <v-btn v-if="incoming" text @click.stop="startPrivateChat" class="ma-0 pa-0"
      >{{ $t("menu.start_private_chat") }}</v-btn
    >
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  mounted() {
      // Any items to show?
      if (this.room && this.event && this.$matrix.isDirectRoomWith(this.room, this.event.getSender())) {
        this.$emit("close");
      }
  },
  methods: {
    startPrivateChat() {
      this.$emit("close");
      this.$emit("start-private-chat", { event: this.event });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>