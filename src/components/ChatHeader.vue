<template>
  <v-container fluid v-if="room">
    <v-row class="chat-header-row">
      <v-col
        class="chat-header-members text-center flex-grow-0 flex-shrink-1 ma-0 pa-0"
      >
        <v-avatar size="40">
          <v-img :src="room.avatar" />
        </v-avatar>
      </v-col>

      <v-col class="flex-grow-1 flex-shrink-1 ma-0 pa-0">
        <div class="room-name" @click.stop="showRoomInfo">{{ room.summary.info.title }}</div>
        <div class="num-members">{{ memberCount }}{{ memberCount > 1 ? " members" : " member" }}</div>
      </v-col>
      <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
        <v-btn text class="leave-button" @click.stop="leaveRoom">Leave</v-btn>
      </v-col>
    </v-row>

    <!-- "REALLY LEAVE?" dialog -->
    <LeaveRoomDialog :show="showLeaveConfirmation" :room="room" @close="showLeaveConfirmation = false" />

  </v-container>
</template>

<script>
import LeaveRoomDialog from '../components/LeaveRoomDialog';

export default {
  name: "ChatHeader",
  components: {
    LeaveRoomDialog
  },
  data() {
    return {
      memberCount: null,
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

    doLeaveRoom() {
      //this.$matrix.matrixClient.forget(this.room.roomId, true, undefined)
      const roomId = this.room.roomId;
      this.$matrix.matrixClient.leave(roomId, undefined)
      .then(() => {
        console.log("Left room");
        this.$matrix.matrixClient.store.removeRoom(roomId);
        this.$navigation.push({name:'Chat', params:{roomId:null}}, -1);
      })
      .catch(err => {
        console.log("Error leaving", err);
      });
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>