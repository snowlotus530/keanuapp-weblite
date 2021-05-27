<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="80%">
    <div class="dialog-content text-center">
      <template>
        <v-icon color="black" size="30">lock</v-icon>
        <h2 class="dialog-title">{{ $t("purge_room.title") }}</h2>
        <div class="dialog-text">
          {{ $t("purge_room.info") }}
        </div>
        <div class="dialog-text">
          {{ status }}
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
              :disabled="isPurging"
              @click="showDialog = false"
              >{{ $t("menu.cancel") }}</v-btn
            >
          </v-col>
          <v-col cols="6" align="center">
            <v-btn
              color="red"
              depressed
              block
              class="filled-button"
              :disabled="isPurging"
              @click.stop="onPurgeRoom()"
              >{{ $t("purge_room.button") }}</v-btn
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
      isPurging: false,
      status: null,
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
    onPurgeRoom() {
      this.isPurging = true;
      this.$matrix
        .purgeRoom(this.room.roomId, this.onPurgeStatus)
        .then(() => {
          this.showDialog = false;
          console.log("Purged room");
          this.$navigation.push({ name: "Home", params: { roomId: null } }, -1);
        })
        .catch((err) => {
          console.error("Error purging", err);
          this.status = this.$t("room.purge_failed");
        })
        .finally(() => {
          this.isPurging = false;
        });
    },

    onPurgeStatus(message) {
      this.status = message;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 