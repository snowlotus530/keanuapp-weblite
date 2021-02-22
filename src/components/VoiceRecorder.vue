<template>
  <div
    v-show="show"
    :class="{ 'voice-recorder': true, 'will-cancel': willCancel }"
    ref="vr_root"
  >
    <v-container fluid fill-height>
      <v-row align="center" justify="center">
        <v-col class="text-center">
          <div class="recording-time">
            {{ recordingTime }}
          </div>
        </v-col>
      </v-row>
    </v-container>
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

export default {
  name: "VoiceRecorder",
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
      willCancel: false,
      states: State,
      state: State.INITIAL,
      recordStartedAt: null,
      recordingTime: null,
      recordTimer: null,
    };
  },
  watch: {
    show(val) {
      if (val) {
        // Add listeners
        document.addEventListener("mouseup", this.mouseUp, false);
        document.addEventListener("mousemove", this.mouseMove, false);
        this.startRecording();
      } else {
        // Remove listeners
        document.removeEventListener("mouseup", this.mouseUp, false);
        document.removeEventListener("mousemove", this.mouseMove, false);
      }
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
      document.body.style.cursor = "";
      if (this.willCancel) {
        this.cancelRecording();
      } else {
        this.stopRecording();
      }
      this.close();
    },
    mouseMove(event) {
      document.body.style.cursor = "ns-resize";
      let rect = this.$refs.vr_root.getBoundingClientRect();
      this.willCancel = event.clientY < rect.top;
      console.log(
        "Cancel: " + this.willCancel + " " + event.clientY + " " + rect.top
      );

      // let bottom = rect.bottom;
      // let mouseBottom = event.clientY;
      // let newHeight = Math.max(
      //   200,
      //   Math.min(0.7 * window.innerHeight, bottom - mouseBottom)
      // );
      // this.$refs.chatPane.style.height = newHeight + "px";
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
          //this.state = State.ERROR;
        });
    },
    cancelRecording() {
      this.state = State.INITIAL;
      this.recorder.stop();
      this.stopRecordTimer();
    },
    stopRecording() {
      this.state = State.RECORDED;
      this.stopRecordTimer();
      this.recorder
        .stop()
        .getMp3()
        .then(([buffer, blob]) => {
          // do what ever you want with buffer and blob
          // Example: Create a mp3 file and play
          const file = new File(buffer, util.formatRecordStartTime(this.recordStartedAt) + ".mp3", {
            type: blob.type,
            lastModified: Date.now(),
          });
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