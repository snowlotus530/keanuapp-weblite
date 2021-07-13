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
      :data-state="isDragging ? 'dragging' : state"
      ref="pan"
      :style="{ top: `${y}px` }"
      v-dragUpDown:[dragArgument]="onDrag"
    >
      <div class="bottom-sheet-handle">
        <div class="bottom-sheet-handle-decoration" />
      </div>
      <div
        ref="sheetContent"
        style="
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          padding: 20px;
        "
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
//import Hammer from "hammerjs";

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
      isDragging: false,
      state: this.defaultState,
      rect: {},
    };
  },
  computed: {
    dragArgument() {
      if (this.state == "open") {
        return "";
      }
      return "prevent";
    },
  },
  mounted() {
    window.onresize = () => {
      this.rect = this.$refs.sheet.getBoundingClientRect();
    };
    this.rect = this.$refs.sheet.getBoundingClientRect();

    // this.mc = new Hammer(this.$refs.pan);
    // this.mc.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    // const self = this;

    // this.mc.on("panup pandown", (evt) => {
    //   self.y = evt.center.y - this.startYDelta;
    // });

    // this.mc.on("panstart", (evt) => {
    //   self.startYDelta = evt.center.y - this.y;
    //   self.isMove = true;
    // });

    // this.mc.on("panend", (ignoredevt) => {
    //   self.isMove = false;

    //   const openY = this.calcY("open");
    //   const smallY = this.calcY("small");
    //   const closeY = this.calcY("closed");

    //   const dOpen = Math.abs(openY - this.y);
    //   const dSmall = Math.abs(smallY - this.y);
    //   const dClose = Math.abs(closeY - this.y);
    //   if (dOpen < dSmall) {
    //     this.setState("open");
    //   } else if (dClose < dSmall) {
    //     this.setState("close");
    //   } else {
    //     this.setState("small");
    //   }
    // });
    this.y = this.calcY(this.state);
  },
  beforeDestroy() {
    //this.mc.destroy();
    window.onresize = null;
  },
  methods: {
    onDrag(dragging, delta) {
      if (dragging) {
        if (!this.isDragging) {
          this.isDragging = true;
          this.startY = this.y;
        }
        this.y = this.startY + delta;
      } else if (this.isDragging) {
        this.isDragging = false;
        const openY = this.calcY("open");
        const smallY = this.calcY("small");
        const closeY = this.calcY("closed");

        const dOpen = Math.abs(openY - this.y);
        const dSmall = Math.abs(smallY - this.y);
        const dClose = Math.abs(closeY - this.y);
        if (dOpen < dSmall) {
          this.setState("open");
        } else if (dClose < dSmall) {
          this.setState("closed");
        } else {
          this.setState("small");
        }
      }
      console.log("OnDrag", dragging, delta);
    },
    calcY(state) {
      switch (state) {
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
      console.log("Set state", state);
      this.state = state;
      if (state == "closed") {
        this.scrollToTop();
      }
      this.y = this.calcY(state);
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
