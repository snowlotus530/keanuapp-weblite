<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="50%">
    <v-card>
      <v-card-title>Are you sure you want to leave?</v-card-title>
      <v-card-text>
        <div>You may not be able to rejoin.</div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          text
          @click="
            doLeaveRoom();
            showDialog = false;
          "
          >Next</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  name: "LeaveRoomDialog",
  props: {
    show: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
    room: {
        type: Object,
        default: function() {
            return null;
        }
    }
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
            this.$emit('close');
        }
    }
  },

  methods: {
    doLeaveRoom() {
      //this.$matrix.matrixClient.forget(this.room.roomId, true, undefined)
      const roomId = this.room.roomId;
      this.$matrix.matrixClient
        .leave(roomId, undefined)
        .then(() => {
          console.log("Left room");
          this.$matrix.matrixClient.store.removeRoom(roomId);
          this.$navigation.push({ name: "Chat", params: { roomId: null } }, -1);
        })
        .catch((err) => {
          console.log("Error leaving", err);
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 