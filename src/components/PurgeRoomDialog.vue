<template>
  <v-dialog v-model="showDialog" v-show="room" class="ma-0 pa-0" width="80%">
    <div v-if="timeout == -1" class="dialog-content text-center">
      <template>
        <v-img contain height="28" src="@/assets/icons/trash_black.svg" />
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

    <!-- Timer -->
    <div v-if="timeout >= 0 && !isPurging" class="dialog-content text-center">
      <template>
        <v-img
          contain
          width="20"
          class="d-inline-block me-2"
          src="@/assets/icons/timer.svg"
        />{{ $t("purge_room.n_seconds", { seconds: timeout }) }}
        <h2 class="dialog-title">{{ $t("purge_room.self_destruct") }}</h2>
        <div class="dialog-text">
          {{ $t("purge_room.notified") }}
        </div>
        <div class="dialog-text">
          {{ status }}
        </div>
      </template>
      <v-container fluid>
        <v-row cols="12">
          <v-col cols="12">
            <v-btn
              depressed
              text
              block
              class="text-button"
              :disabled="isPurging"
              @click="undo"
              >{{ $t("menu.undo") }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Purging -->
    <div v-if="isPurging" class="dialog-content text-center">
      <h2 class="dialog-title">{{ $t("purge_room.deleting") }}</h2>
      <div class="dialog-text">
        {{ status }}
      </div>
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
      timeout: -1,
      timeoutTimer: null,
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
    undo() {
      if (this.timeoutTimer) {
        clearInterval(this.timeoutTimer);
        this.timeoutTimer = null;
      }
      this.timeout = -1;

      // Cancel the state event for deletion
      this.$matrix.matrixClient.sendStateEvent(
        this.room.roomId,
        "im.keanu.room_deletion_notice",
        { status: "cancel" }
      );

      this.showDialog = false;
    },
    onPurgeRoom() {
      // Send custom state event!
      this.$matrix.matrixClient.sendStateEvent(
        this.room.roomId,
        "im.keanu.room_deletion_notice",
        { status: "delete" }
      );

      this.timeout = 30;
      this.timeoutTimer = setInterval(() => {
        this.timeout = this.timeout - 1;
        if (this.timeout == 0) {
          clearInterval(this.timeoutTimer);
          this.timeoutTimer = null;
          this.onDoPurgeRoom();
        }
      }, 1000);
    },
    onDoPurgeRoom() {
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
