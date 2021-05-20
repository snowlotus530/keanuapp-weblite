<template>
  <div class="audio-player d-flex flex-row" style="align-items: center">
    <audio ref="player" :src="src" @durationchange="updateDuration">
      <slot></slot>
    </audio>
    <v-btn v-if="playing" @click.stop="pause" icon
      ><v-icon size="20">pause</v-icon></v-btn
    >
    <v-btn v-else @click.stop="play" icon
      ><v-icon size="20">play_arrow</v-icon></v-btn
    >
    <div class="play-time" style="flex: 1 0 80px">
      {{ currentTime }} / {{ totalTime }}
    </div>
    <v-slider 
      color="currentColor"
      track-color="#cccccc"
      class="play-progress"
      v-model="playheadPercent"
      style="flex: 1 1 100%; height: 30px"
      min="0"
      max="100"
    />
  </div>
</template>

<script>
import util from "../../plugins/utils";

export default {
  props: {
    src: {
      type: String,
      default: function () {
        return null;
      },
    },
  },
  data() {
    return {
      player: null,
      duration: 0,
      playPercent: 0,
      playTime: 0,
      playing: false,
    };
  },
  mounted() {
    this.player = this.$refs.player;
    this.player.addEventListener("timeupdate", this.updateProgressBar);
    this.player.addEventListener("play", () => {
      this.playing = true;
    });
    this.player.addEventListener("pause", () => {
      this.playing = false;
    });
    this.player.addEventListener("ended", function () {
      this.pause();
      this.playing = false;
    });
  },
  computed: {
    currentTime() {
      return util.formatDuration(this.playTime);
    },
    totalTime() {
      return util.formatDuration(this.duration);
    },
    playheadPercent: {
      get: function () {
        return this.playPercent;
      },
      set: function (percent) {
        if (this.player.src) {
          this.playPercent = percent;
          this.player.currentTime = (percent / 100) * this.player.duration;
        }
      },
    },
  },
  methods: {
    play() {
      if (this.player.src) {
        if (this.player.paused) {
          this.player.play();
        } else if (this.player.ended) {
          // restart
          this.player.currentTime = 0;
          this.player.play();
        }
      }
    },
    pause() {
      if (this.player.src) {
        this.player.pause();
      }
    },
    updateProgressBar() {
      if (this.player.duration > 0) {
        this.playPercent = Math.floor(
          (100 / this.player.duration) * this.player.currentTime
        );
      } else {
        this.playPercent = 0;
      }
      this.playTime = 1000 * this.player.currentTime;
    },
    updateDuration() {
      this.duration = 1000 * this.player.duration;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>
