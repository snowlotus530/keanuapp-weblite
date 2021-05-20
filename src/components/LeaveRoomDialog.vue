<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="80%">
    <div class="dialog-content text-center">
      <template v-if="roomJoinRule == 'public'">
        <h1>👋</h1>
        <h2 class="dialog-title">
          {{$t('leave.title_public',{user: $matrix.currentUserDisplayName})}}
        </h2>
        <div
          v-if="$matrix.currentUser.is_guest && lastRoom"
          class="dialog-text"
        >
        <i18n path="leave.text_public_lastroom" tag="p">
          <template v-slot:user>
            <span>{{ $matrix.currentUserDisplayName }}</span>
          </template>
          <template v-slot:action>
            <a @click.prevent="viewProfile">{{ $t('leave.create_account') }}</a>
          </template>
          </i18n>
        </div>
        <div v-else class="dialog-text">{{$t('leave.text_public')}}</div>
      </template>
      <template v-else>
        <v-icon color="black" size="30">lock</v-icon>
        <h2 class="dialog-title">{{$t('leave.title_invite',{user: $matrix.currentUserDisplayName})}}</h2>
        <div class="dialog-text">{{$t('leave.text_invite')}}</div>
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
              >{{$t('leave.go_back')}}</v-btn
            >
          </v-col>
          <v-col cols="6" align="center">
            <v-btn
              color="red"
              depressed
              block
              class="filled-button"
              @click.stop="onLeaveRoom()"
              >{{$t('leave.leave')}}</v-btn
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
      lastRoom: false,
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
      } else {
        this.lastRoom = this.onlyJoinedToThisRoom();
      }
    },
  },

  methods: {
    onlyJoinedToThisRoom() {
      const joinedRooms = this.$matrix.joinedRooms;
      if (
        joinedRooms &&
        joinedRooms.length == 1 &&
        joinedRooms[0].roomId == this.room.roomId
      ) {
        return true;
      }
      return false;
    },

    onLeaveRoom() {
      const lastRoom = this.onlyJoinedToThisRoom();
      //this.$matrix.matrixClient.forget(this.room.roomId, true, undefined)
      const roomId = this.room.roomId;
      this.$matrix
        .leaveRoom(roomId)
        .then(() => {
          this.showDialog = false;
          console.log("Left room");
          if (lastRoom) {
            this.$navigation.push({ name: "Goodbye" }, -1);
          } else {
            this.$navigation.push(
              { name: "Home", params: { roomId: null } },
              -1
            );
          }
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