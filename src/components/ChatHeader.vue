<template>
  <v-container fluid>
    <v-row class="chat-header-row">
      <v-col
        class="chat-header-members text-center flex-grow-0 flex-shrink-1 ma-0 pa-0"
      >
        <v-btn icon class="members-icon" @click.stop="showRoomInfo">
          <v-icon>people</v-icon>
        </v-btn>
        <div class="num-members">{{ memberCount }}</div>
      </v-col>

      <v-col class="flex-grow-1 flex-shrink-1 ma-0 pa-0">
        <div class="room-name" v-if="room">{{ room.summary.info.title }}</div>
      </v-col>
      <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
        <v-btn class="leave-button">Leave</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "ChatHeader",
  data() {
    return {
      memberCount: null,
    };
  },
  mounted() {
    this.$matrix.on("Room.timeline", this.onEvent);
    this.updateMemberCount();
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
  },

  computed: {
    room() {
      return this.$matrix.currentRoom;
    },
  },

  watch: {
    room: {
      handler(newVal, ignoredOldVal) {
        this.memberCount = newVal.getJoinedMemberCount();
      },
    },
  },

  methods: {
    onEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      if (event.getType() == "m.room.member") {
        this.updateMemberCount();
      }
    },

    updateMemberCount() {
      this.memberCount = this.room.getJoinedMemberCount();
    },

    showRoomInfo() {
      this.$router.push({ name: "RoomInfo" });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>