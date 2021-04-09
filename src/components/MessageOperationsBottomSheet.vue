<template>
  <div class="message-operations-bottom-sheet">
    <v-fade-transition>
      <div
        v-show="!closed"
        @click.stop="backgroundClick"
        style="
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-color: rgba(0, 0, 0, 0.3);
        "
      />
    </v-fade-transition>
    <SwipeableBottomSheet
      class="bottom-sheet ma-0 pa-0"
      ref="sheet"
      :halfY="0.5"
      :openY="0.2"
      :data-closed="closed ? 1 : 0"
    >
      <slot></slot>
    </SwipeableBottomSheet>
  </div>
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
      closed: true,
    };
  },
  mounted() {
    this.$watch("$refs.sheet.state", (new_value, ignored_old_value) => {
      this.closed = new_value == "close";
    });
  },
  methods: {
    open() {
      if (this.$refs.sheet.state == "half") {
        this.$refs.sheet.setState("close");
      } else {
        // Reset scroll before opening!
        this.$refs.sheet.setState("half");
      }
    },

    close() {
      this.$refs.sheet.setState("close");
    },

    backgroundClick() {
      if (this.$refs.sheet.state == "half") {
        this.$refs.sheet.setState("close");
      } else {
        this.$refs.sheet.setState("half");
      }
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
  display: none;
  transition: all 0.3s;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent !important;
}

.message-operations-bottom-sheet {
  .pan-area {
    padding-bottom: 0px;
  }
  .card {
    padding: 0px !important;
  }
}

</style>
