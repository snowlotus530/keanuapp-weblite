<template>
  <SwipeableBottomSheet
    class="bottom-sheet"
    ref="sheet"
    :halfY="1"
    :openY="0.4"
    :data-closed="closed ? 1 : 0"
  >
  <slot></slot>
  </SwipeableBottomSheet>
</template>

<script>
import SwipeableBottomSheet from "vue-swipeable-bottom-sheet/src/components/SwipeableBottomSheet";
export default {
  name: "MessageOperationsBottomSheet",
  components: {
    SwipeableBottomSheet,
  },
  data() {
    return {
      closed: true
    }
  },
  mounted() {
    this.$watch(
      "$refs.sheet.state",
      (new_value, ignored_old_value) => {
        this.closed = new_value == 'close';
        if (new_value == 'half') {
          this.$refs.sheet.setState("close");
        }
      }
    );
  },
  methods: {
    open() {
      if (this.$refs.sheet.state == "half") {
        this.$refs.sheet.setState("close");
      } else {
        // Reset scroll before opening!
        this.$refs.sheet.setState("open");
      }
    },

    close() {
      this.$refs.sheet.setState("close");
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";

/* Default implementation only dims background when fully open,
 so we use our own flag (data-closed) here to that we can
 dim also when it is just half open */
.bottom-sheet[data-closed="0"] .bg {
  display: block;
  transition: all 0.3s;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3) !important;
}
</style>