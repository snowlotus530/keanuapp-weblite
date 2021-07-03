<template>
  <BottomSheet
    class="room-info-bottom-sheet"
    ref="sheet"
  >
    <div class="room-info-sheet" ref="roomInfoSheetContent">
      <div class="text-center current-room">
        <v-avatar class="room-avatar">
          <v-img v-if="roomAvatar" :src="roomAvatar" />
          <span v-else class="white--text headline">{{
            roomName.substring(0, 1).toUpperCase()
          }}</span>
        </v-avatar>
        <div class="h4">{{$t('room_info_sheet.this_room')}}</div>
        <div class="h2">{{ roomName }}</div>
        <v-btn
          height="20px"
          color="black"
          class="filled-button"
          @click.stop="showDetails"
          >{{$t('room_info_sheet.view_details')}}</v-btn
        >
      </div>
      <room-list :title="'Other roomss'" v-on:close="close" v-on:newroom="createRoom" :showCreate="true" />
    </div>
  </BottomSheet>
</template>

<script>
import BottomSheet from "./BottomSheet";
import RoomList from "./RoomList.vue";
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "RoomInfoBottomSheet",
  mixins: [roomInfoMixin],
  components: {
    BottomSheet,
    RoomList,
  },
  methods: {
    open() {
      this.$refs.sheet.open();
    },

    close() {
      this.$refs.sheet.close();
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
</style>
