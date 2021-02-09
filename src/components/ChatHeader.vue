<template>
  <v-container fluid v-if="room">
    <v-row class="chat-header-row flex-nowrap">
      <v-col
      cols="auto"
        class="chat-header-members text-start ma-0 pa-0"
      >
        <v-avatar size="40" class="mr-2">
          <v-img :src="room.avatar" />
        </v-avatar>
      </v-col>

      <v-col class="ma-0 pa-0 flex-shrink-1 flex-nowrap" style="overflow:hidden">
        <div class="d-flex flex-nowrap room-name" @click.stop="showRoomList = true">{{ room.summary.info.title }} <v-icon>expand_more</v-icon></div>
        <RoomList v-if="showRoomList" v-click-outside="hideRoomList" @close="hideRoomList" />
        <div class="num-members">{{ memberCount }}{{ memberCount > 1 ? " members" : " member" }}</div>
      </v-col>
      <v-col cols="auto" class="text-end ma-0 pa-0">
        <v-btn text class="info-button" @click.stop="showRoomInfo"><v-icon color="black">info</v-icon></v-btn>
      </v-col>
      <v-col cols="auto" class="text-end ma-0 pa-0">
        <v-btn text class="leave-button" @click.stop="leaveRoom">Leave</v-btn>
      </v-col>
    </v-row>

    <!-- "REALLY LEAVE?" dialog -->
    <LeaveRoomDialog :show="showLeaveConfirmation" :room="room" @close="showLeaveConfirmation = false" />

  </v-container>
</template>

<script>
import LeaveRoomDialog from '../components/LeaveRoomDialog';
import RoomList from "../components/RoomList";

export default {
  name: "ChatHeader",
  components: {
    LeaveRoomDialog,
    RoomList
  },
  data() {
    return {
      memberCount: null,
      showRoomList: false,
      showLeaveConfirmation: false
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
        if (newVal) {
          this.memberCount = newVal.getJoinedMemberCount();
        } else {
          this.memberCount = null;
        }
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
      if (!this.room) {
        this.memberCount = 0;
      } else {
        this.memberCount = this.room.getJoinedMemberCount();
      }
    },

    showRoomInfo() {
      this.$navigation.push({ name: "RoomInfo" });
    },

    leaveRoom() {
      this.showLeaveConfirmation = true;
    },

    hideRoomList() {
      this.showRoomList = false;
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>