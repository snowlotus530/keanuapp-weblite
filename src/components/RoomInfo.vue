<template>
  <div>
    <v-container fluid>
      <v-row class="chat-header-row">

        <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
          <v-btn icon @click.stop="$router.go(-1)">
            <v-icon>arrow_back</v-icon>
          </v-btn>
        </v-col>

        <!-- <v-col class="chat-header-members text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
          <v-btn icon class="members-icon" @click.stop="showRoomInfo">
            <v-icon>people</v-icon>
          </v-btn>
          <div class="num-members">{{ memberCount }}</div>
        </v-col> -->

        <v-col class="flex-grow-1 flex-shrink-1 ma-0 pa-0">
          <div class="room-name" v-if="room">{{ room.summary.info.title }}</div>        
        </v-col>
        <!-- <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
          <v-btn class="leave-button">Leave</v-btn>
        </v-col> -->
      </v-row>
    </v-container>
  
      <h3>Work in progress!</h3>

        <div v-for="member in room.getJoinedMembers()" :key="member.userId">
                <v-avatar class="avatar" size="40" color="grey">
        <img
          v-if="memberAvatar(member)"
          :src="memberAvatar(member)"
        />
        <span v-else class="white--text headline">{{
          member.name.substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>
          {{ member.name }}
        </div>
  </div>
</template>

<script>
export default {
  name: "RoomInfo",
  data() {
    return {
      memberCount: null
    }
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
        console.log("RoomInfo: Current room changed");
        this.memberCount = newVal.getJoinedMemberCount();
      }
    }
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
      
    },

    memberAvatar(member) {
      if (member) {
        return member.getAvatarUrl(
          this.$matrix.matrixClient.getHomeserverUrl(),
          40,
          40,
          "scale",
          true
        );
      }
      return null;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>