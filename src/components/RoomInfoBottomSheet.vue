<template>
  <SwipeableBottomSheet
    class="bottom-sheet"
    ref="roomInfoSheet"
    :halfY="0.5"
    :openY="0.1"
    :data-closed="closed ? 1 : 0"
  >
    <div class="room-info-sheet" ref="roomInfoSheetContent">
      <div class="text-center current-room">
        <v-avatar class="room-avatar">
          <v-img v-if="roomAvatar" :src="roomAvatar" />
          <span v-else class="white--text headline">{{
            roomName.substring(0, 1).toUpperCase()
          }}</span>
        </v-avatar>
        <div class="h4">This group</div>
        <div class="h2">{{ roomName }}</div>
        <v-btn
          height="20px"
          color="black"
          class="filled-button"
          @click.stop="showDetails"
          >View details</v-btn
        >
      </div>
      <room-list :title="'Other groups'" v-on:close="close" />
      <v-btn
          height="20px"
          color="black"
          class="outlined-button"
          @click.stop="createRoom"
          >Create group</v-btn
        >
    </div>
  </SwipeableBottomSheet>
</template>

<script>
import SwipeableBottomSheet from "vue-swipeable-bottom-sheet/src/components/SwipeableBottomSheet";
import RoomList from "./RoomList.vue";
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "RoomInfoBottomSheet",
  mixins: [roomInfoMixin],
  components: {
    SwipeableBottomSheet,
    RoomList,
  },
  data() {
    return {
      closed: true
    }
  },
  mounted() {
    this.$watch(
      "$refs.roomInfoSheet.state",
      (new_value, ignored_old_value) => {
        this.closed = new_value == 'close';
      }
    );
  },
  methods: {
    open() {
      if (this.$refs.roomInfoSheet.state == "half") {
        this.$refs.roomInfoSheet.setState("close");
      } else {
        // Reset scroll before opening!
        this.$refs.roomInfoSheetContent.parentElement.scrollTop = 0;
        this.$refs.roomInfoSheet.setState("half");
      }
    },

    close() {
      this.$refs.roomInfoSheet.setState("close");
    },

    showDetails() {
      this.close();
      this.$navigation.push({ name: "RoomInfo" });
    },

    createRoom() {
      this.close();
      this.$navigation.push({ name: "CreateRoom" });
    }

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