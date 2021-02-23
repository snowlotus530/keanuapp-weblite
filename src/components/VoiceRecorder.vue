<template>
  <div v-show="show" class="voice-recorder" ref="vrroot">
    <v-container fluid fill-height>
      <v-row align="center">
        <v-col cols="3">
          <div class="recording-time">
            {{ recordingTime }}
          </div>
        </v-col>
        <v-col cols="6">
          <div class="swipe-info">&lt;&lt; Swipe to cancel</div>
        </v-col>
      </v-row>
    </v-container>
    <transition name="fade" mode="out-in">
      <div
        v-if="willCancel"
        class="will-cancel"
        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
      >
        <v-container fluid fill-height>
          <v-row align="center">
            <v-col cols="3">
              <v-icon color="white">delete_outline</v-icon>
            </v-col>
            <v-col cols="6">
              <div class="swipe-info">Release to cancel</div>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </transition>

    <transition name="fade" mode="out-in">
      <div
        v-if="recordingLocked"
        class="locked"
        style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
      >
        <v-container fluid fill-height>
          <v-row align="center">
            <v-col cols="3">
              <div class="recording-time">
                {{ recordingTime }}
              </div>
            </v-col>
            <v-col cols="3">
              <v-btn @click.stop="cancelRecording" text class="swipe-info"
                >Cancel</v-btn
              >
            </v-col>
            <v-col cols="3">
              <v-btn @click.stop="stopRecording" icon class="swipe-info"
                ><v-icon color="white">stop</v-icon></v-btn
              >
            </v-col>
          </v-row>
        </v-container>
      </div>
    </transition>

    <div
      v-if="state == states.ERROR"
      class="error"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"
    >
      <v-container fluid fill-height>
        <v-row align="center">
          <v-col>
            <div class="swipe-info">Failed to record audio</div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <VoiceRecorderLock v-show="state == states.RECORDING" :style="lockButtonStyle" :isLocked="recordingLocked" />
  </div>
</template>
<script>
const State = {
  INITIAL: "intial",
  RECORDING: "recording",
  RECORDED: "recorded",
  ERROR: "error",
};
import util from "../plugins/utils";
import VoiceRecorderLock from "./VoiceRecorderLock";

export default {
  name: "VoiceRecorder",
  components: {
    VoiceRecorderLock,
  },
  props: {
    show: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
    micButtonRef: {
      type: Object,
      default: function () {
        return null;
      },
    },
  },
  data() {
    return {
      willCancel: false,
      /** Starting X coordinate of dragging operations */
      startCoordinateX: null,
      startCoordinateY: null,
      states: State,
      state: State.INITIAL,
      recordStartedAt: null,
      recordingTime: null,
      recordTimer: null,
      recordingLocked: false,
    };
  },
  watch: {
    show(val) {
      if (val) {
        // Add listeners
        this.state = State.INITIAL;
        document.addEventListener("mouseup", this.mouseUp, false);
        document.addEventListener("mousemove", this.mouseMove, false);
        document.addEventListener("touchend", this.mouseUp, false);
        document.addEventListener("touchmove", this.mouseMove, false);
        this.startRecording();
      } else {
        // Remove listeners
        document.removeEventListener("mouseup", this.mouseUp, false);
        document.removeEventListener("mousemove", this.mouseMove, false);
        document.removeEventListener("touchend", this.mouseUp, false);
        document.removeEventListener("touchmove", this.mouseMove, false);
        this.startCoordinateX = null;
        this.startCoordinateY = null;
        this.willCancel = false;
        this.startCoordinateX = null;
        this.startCoordinateY = null;
        this.recordingLocked = false;
      }
    },
  },
  computed: {
    lockButtonStyle() {
      /**
        Calculate where to show the lock button (it should be at the same X-coord as the)
        mic button (given as a reference!)
      */
      var left = 0;
      var width = 20;
      if (this.micButtonRef) {
        var r = this.micButtonRef.$el.getBoundingClientRect();
        left = r.left;
        width = r.right - r.left;
      }
      const s =
        "position:absolute;top:-50px;left:" +
        left +
        "px;width:" +
        width +
        "px;height:40px";
      return s;
    },
  },
  methods: {
    close() {
      this.stopRecordTimer();
      this.$emit("close");
    },
    mouseUp(ignoredEvent) {
      document.removeEventListener("mouseup", this.mouseUp, false);
      document.removeEventListener("mousemove", this.mouseMove, false);
      document.removeEventListener("touchend", this.mouseUp, false);
      document.removeEventListener("touchmove", this.mouseMove, false);
      //document.body.style.cursor = "";
      if (this.state == State.RECORDING) {
        if (!this.recordingLocked) {
          if (this.willCancel) {
            this.cancelRecording();
          } else {
            this.stopRecording();
          }
        }
      } else {
        this.cancelRecording();
      }
    },
    mouseMove(event) {
      var x = event.clientX;
      var y = event.clientY;
      if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      }
      if (!this.startCoordinateX) {
        // First move, set it!
        this.startCoordinateX = x;
        this.startCoordinateY = y;
      }
      //document.body.style.cursor = "ns-resize";
      this.willCancel = x < this.startCoordinateX - 30;
      if (y < this.startCoordinateY - 30 && !this.willCancel) {
        this.recordingLocked = true;
      }
      event.preventDefault();
      event.stopPropagation();
    },

    startRecording() {
      const MicRecorder = require("mic-recorder-to-mp3");
      // Start recording. Browser will request permission to use your microphone.
      this.recorder = new MicRecorder({
        bitRate: 128,
      });
      this.recorder
        .start()
        .then(() => {
          this.state = State.RECORDING;
          this.recordStartedAt = Date.now();
          this.startRecordTimer();
        })
        .catch((e) => {
          console.error(e);
          this.state = State.ERROR;
        });
    },
    cancelRecording() {
      this.state = State.INITIAL;
      this.recorder.stop();
      this.stopRecordTimer();
      this.close();
    },
    stopRecording() {
      this.state = State.RECORDED;
      this.stopRecordTimer();
      this.close();
      this.recorder
        .stop()
        .getMp3()
        .then(([buffer, blob]) => {
          // do what ever you want with buffer and blob
          // Example: Create a mp3 file and play
          const file = new File(
            buffer,
            util.formatRecordStartTime(this.recordStartedAt) + ".mp3",
            {
              type: blob.type,
              lastModified: Date.now(),
            }
          );
          //console.log(file);
          this.$emit("file", {file: file});
          // const player = new Audio(URL.createObjectURL(file));
          // player.play();
        })
        .catch((e) => {
          alert("We could not retrieve your message");
          console.log(e);
        });
    },
    startRecordTimer() {
      this.stopRecordTimer();
      this.recordTimer = setInterval(() => {
        const now = Date.now();
        this.recordingTime = util.formatRecordDuration(
          now - this.recordStartedAt
        );
      }, 500);
    },
    stopRecordTimer() {
      if (this.recordTimer) {
        clearInterval(this.recordTimer);
        this.recordTimer = null;
        this.recordingTime = null;
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style> 