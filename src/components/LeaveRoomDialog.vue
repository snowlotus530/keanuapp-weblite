<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="80%">
    <v-card>
      <v-card-title class="dialog-title">Are you sure you want to leave?</v-card-title>
      <v-card-text>
        <div class="dialog-text">You may not be able to rejoin.</div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          text
          @click="
            onLeaveRoom();
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
    onLeaveRoom() {
      //this.$matrix.matrixClient.forget(this.room.roomId, true, undefined)
      const roomId = this.room.roomId;
      this.$matrix.leaveRoom(roomId)
      .then(() => {
        console.log("Left room");
        this.$navigation.push({name:'Home', params:{roomId:null}}, -1);
      })
      .catch(err => {
        console.log("Error leaving", err);
      });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 