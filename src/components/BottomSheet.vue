<template>
  <div
    class="bottom-sheet"
    ref="sheet"
    :style="state == 'closed' ? { 'pointer-events': 'none' } : {}"
  >
    <v-fade-transition>
      <div
        class="bottom-sheet-bg"
        v-show="state != 'closed'"
        @click.stop="onBackgroundClick"
      />
    </v-fade-transition>
    <div
      class="bottom-sheet-content"
      :data-state="isMove ? 'move' : state"
      ref="pan"
      :style="{ top: `${isMove ? y : calcY()}px` }"
    >
      <div class="bottom-sheet-handle"><div class="bottom-sheet-handle-decoration" /></div>
      <div ref="sheetContent" style="position:absolute;top:20px;left:0;right:0;bottom:0;overflow-y:auto;padding:20px">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import Hammer from "hammerjs";

export default {
  props: {
    openY: {
      type: Number,
      default: 0.1,
    },
    halfY: {
      type: Number,
      default: 0.5,
    },
    defaultState: {
      type: String,
      default: "closed",
    },
  },
  data() {
    return {
      mc: null,
      y: 0,
      startY: 0,
      isMove: false,
      state: this.defaultState,
      rect: {},
    };
  },
  mounted() {
    window.onresize = () => {
      this.rect = this.$refs.sheet.getBoundingClientRect();
    };
    this.rect = this.$refs.sheet.getBoundingClientRect();

    this.mc = new Hammer(this.$refs.pan);
    this.mc.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    const self = this;

    this.mc.on("panup pandown", (evt) => {
      self.y = evt.center.y - 16;
    });

    this.mc.on("panstart", (evt) => {
      self.startY = evt.center.y;
      self.isMove = true;
    });

    this.mc.on("panend", (evt) => {
      self.isMove = false;

      switch (self.state) {
        case "small":
          if (self.startY - evt.center.y > 120) {
            self.state = "open";
          }

          if (self.startY - evt.center.y < -50) {
            self.state = "closed";
          }
          break;
        case "open":
          if (self.startY - evt.center.y < -120) {
            self.state = "small";
          }
          break;
      }
    });
  },
  beforeDestroy() {
    this.mc.destroy();
    window.onresize = null;
  },
  methods: {
    calcY() {
      switch (this.state) {
        case "closed":
          return this.rect.height;
        case "open":
          return this.rect.height * this.openY;
        case "small":
          return this.rect.height * this.halfY;
        default:
          return this.y;
      }
    },
    open() {
      this.setState("small");
    },
    close() {
      this.setState("closed");
    },
    setState(state) {
      this.state = state;
      if (state == "closed") {
        this.scrollToTop();
      }
    },
    onBackgroundClick() {
      if (this.state == "open") {
        this.setState("small");
      } else {
        this.setState("closed");
      }
    },
    scrollToTop() {
      const container = this.$refs.sheetContent;
      if (container) {
        container.scrollTo(0, 0);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.bottom-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  z-index: 10;
}

.bottom-sheet-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(black, 0.4);
}

.bottom-sheet-handle {
  height: 20px;
  background-color: white;
  position: relative;
  .bottom-sheet-handle-decoration {
    background-color: #cccccc;
    height: 2px;
    position: absolute;
    top: 50%;
    left: 30%;
    right: 30%;
  }
}

.bottom-sheet-content {
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0;
  right: 0;
  border-radius: 10px 10px 0px 0px;
  background-color: white;
  overflow: hidden;
}

.bottom-sheet-content[data-state="small"],
.bottom-sheet-content[data-state="open"],
.bottom-sheet-content[data-state="closed"] {
  transition: top 0.3s ease-out;
}
</style>
