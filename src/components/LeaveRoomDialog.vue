<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="80%">
    <div class="dialog-content text-center">
      <template v-if="roomJoinRule == 'public'">
        <h1>👋</h1>
        <h2 class="dialog-title">
          Goodbye, {{ $matrix.currentUserDisplayName }}.
        </h2>
        <div v-if="$matrix.currentUser.is_guest" class="dialog-text">
          If you want to join this group again, you can join under a new identity. To keep {{ $matrix.currentUserDisplayName }}, <a @click.prevent="viewProfile">create an account</a>.
        </div>
        <div v-else class="dialog-text">
          Since this group is public, you can join again later.
        </div>
      </template>
      <template v-else>
        <v-icon color="black" size="30">lock</v-icon>
        <h2 class="dialog-title">Are you sure you want to leave?</h2>
        <div class="dialog-text">
          This group is locked. You cannot rejoin without a special permission.
        </div>
      </template>
      <v-container fluid>
        <v-row cols="12">
          <v-col cols="6">
            <v-btn
              depressed
              text
              block
              class="text-button"
              @click="showDialog = false"
              >Go back</v-btn
            >
          </v-col>
          <v-col cols="6" align="center">
            <v-btn
              color="red"
              depressed
              block
              class="filled-button"
              @click.stop="
                onLeaveRoom();
                showDialog = false;
              "
              >Leave</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-dialog>
</template>
<script>
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "LeaveRoomDialog",
  mixins: [roomInfoMixin],
  props: {
    show: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
  },
  data() {
    return {
      showDialog: false,
    };
  },
  watch: {
    show: {
      handler(newVal, ignoredOldVal) {
        this.showDialog = newVal;
      },
    },
    showDialog() {
      if (!this.showDialog) {
        this.$emit("close");
      }
    },
  },

  methods: {
    onLeaveRoom() {
      //this.$matrix.matrixClient.forget(this.room.roomId, true, undefined)
      const roomId = this.room.roomId;
      this.$matrix
        .leaveRoom(roomId)
        .then(() => {
          console.log("Left room");
          this.$navigation.push({ name: "Home", params: { roomId: null } }, -1);
        })
        .catch((err) => {
          console.log("Error leaving", err);
        });
    },

    viewProfile() {
      this.showDialog = false;
      this.$navigation.push({ name: "Profile" }, 1);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 