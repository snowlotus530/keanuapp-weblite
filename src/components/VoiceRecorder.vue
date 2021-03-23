<template>
  <transition name="grow" mode="out-in">
    <div v-show="show" :class="{'voice-recorder':true,'ptt':ptt,'row':!ptt}" ref="vrroot">
      <!-- <div style="background-color:red;height:60px;width:100%"/> -->
      <v-container v-if="!ptt" fluid fill-height>
        <v-row align="center" class="mt-3">
          <v-col cols="4" align="center">
            <v-btn v-show="state == states.RECORDED" icon @click.stop="redo">
              <v-icon color="white">undo</v-icon>
            </v-btn>
          </v-col>
          <v-col cols="4" align="center">
            <v-btn
              v-if="state == states.RECORDING"
              style="background-color: white; padding: 30px"
              icon
              @click.stop="pauseRecording"
            >
              <v-icon color="black">stop</v-icon>
            </v-btn>
            <v-btn
              v-else-if="state == states.RECORDED"
              style="background-color: #3ae17d; padding: 30px"
              icon
              :disabled="!recordedFile"
              @click.stop="send"
            >
              <v-icon color="black">arrow_upward</v-icon>
            </v-btn>
            <v-btn
              v-else
              style="background-color: red; padding: 30px"
              icon
              @click.stop="startRecording"
            >
              <v-icon color="white">fiber_manual_record</v-icon>
            </v-btn>
          </v-col>
          <v-col cols="4" align="center">
            <v-btn icon @click.stop="cancelRecording">
              <v-icon color="white">close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <v-container fluid fill-height>
        <v-row align="center">
          <v-col cols="3">
            <div class="recording-time">
              {{ recordingTime }}
            </div>
          </v-col>
          <v-col cols="6" v-if="ptt">
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
              <div class="swipe-info">{{ errorMessage || 'Failed to record audio' }}</div>
            </v-col>
            <v-col align="right">
              <v-btn icon @click.stop="cancelRecording">
                <v-icon color="white">close</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <VoiceRecorderLock
        v-show="state == states.RECORDING && ptt"
        :style="lockButtonStyle"
        :isLocked="recordingLocked"
      />
    </div>
  </transition>
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
require('md-gum-polyfill');

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
    ptt: {
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
      recordingTime: String.fromCharCode(160), // nbsp!
      recordTimer: null,
      recordingLocked: false,
      recordedFile: null,
      errorMessage: null
    };
  },
  watch: {
    micButtonRef(buttonRef) {
      if (buttonRef) {
        var r = buttonRef.$el.getBoundingClientRect();
        var left = r.left;
        var width = r.right - r.left;
        r = this.$refs.vrroot.parentElement.getBoundingClientRect();
        var widthParent = r.right - r.left;
        document.documentElement.style.setProperty(
          "--v-mic-button-left",
          left + "px"
        );
        document.documentElement.style.setProperty(
          "--v-mic-button-width",
          width + "px"
        );
        document.documentElement.style.setProperty(
          "--v-mic-button-container-width",
          widthParent + "px"
        );
        var initialScale = width / widthParent;
        document.documentElement.style.setProperty(
          "--v-mic-button-initial-scale",
          initialScale
        );
        var initialTranslate = left + width / 2 - widthParent / 2;
        document.documentElement.style.setProperty(
          "--v-mic-button-initial-translate",
          initialTranslate + "px"
        );
      }
    },
    show(val) {
      if (val) {
        // Add listeners
        this.state = State.INITIAL;
        this.errorMessage = null;
        this.recordedFile = null;
        if (this.ptt) {
          document.addEventListener("mouseup", this.mouseUp, false);
          document.addEventListener("mousemove", this.mouseMove, false);
          document.addEventListener("touchend", this.mouseUp, false);
          document.addEventListener("touchmove", this.mouseMove, false);
          this.startRecording();
        } else {
          console.log("Not PTT");
          this.micButtonRef.$el.style.display = "none";
        }
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
        this.micButtonRef.$el.style.display = "block";
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
      this.recordingTime = String.fromCharCode(160); // nbsp;
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
          if (e && e.name == "NotAllowedError") {
            this.errorMessage = e.message;
          }
          this.state = State.ERROR;
        });
    },
    cancelRecording() {
      this.state = State.INITIAL;
      if (this.recorder) {
        this.recorder.stop();
      }
      this.stopRecordTimer();
      this.recordingTime = String.fromCharCode(160); // nbsp;
      this.close();
    },
    pauseRecording() {
      this.state = State.RECORDED;
      this.stopRecordTimer();
      this.getFile(false);
    },
    stopRecording() {
      this.state = State.RECORDED;
      this.stopRecordTimer();
      this.recordingTime = String.fromCharCode(160); // nbsp;
      this.close();
      this.getFile(true);
    },
    redo() {
      this.state = State.INITIAL;
      this.recordedFile = null;
      this.recordingTime = String.fromCharCode(160); // nbsp;
    },
    send() {
      //console.log("Send:", this.recordedFile);
      this.$emit("file", {file: this.recordedFile});
      // const player = new Audio(URL.createObjectURL(file));
      // player.play();
    },
    getFile(send) {
      this.recorder
        .stop()
        .getMp3()
        .then(([buffer, blob]) => {
          // do what ever you want with buffer and blob
          // Example: Create a mp3 file and play
          this.recordedFile = new File(
            buffer,
            util.formatRecordStartTime(this.recordStartedAt) + ".mp3",
            {
              type: blob.type,
              lastModified: Date.now(),
            }
          );
          if (send) {
            this.send();
          }
        })
        .catch((e) => {
          alert("We could not retrieve your message");
          console.log(e);
        });
    },
    startRecordTimer() {
      this.stopRecordTimer();
      this.recordingTime = String.fromCharCode(160); // nbsp;
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
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>
<style>
.grow-enter-active,
.grow-leave-active {
  transition-timing-function: ease-out;
  transition: opacity 0.3s, border-radius 0.5s, transform 0.5s;
}
.grow-enter,
.grow-leave-to {
  transform: translateX(var(--v-mic-button-initial-translate))
    scaleX(var(--v-mic-button-initial-scale));
  opacity: 0;
  border-radius: 25px !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style> 