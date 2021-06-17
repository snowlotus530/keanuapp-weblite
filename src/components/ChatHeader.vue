<template>
  <v-container fluid v-if="room">
    <v-row class="chat-header-row flex-nowrap">
      <v-col
      cols="auto"
        class="chat-header-members text-start ma-0 pa-0"
        style="overflow:hidden;cursor:pointer" @click.stop="onHeaderClicked"
      >
        <v-avatar size="40" class="mr-2">
          <v-img :src="room.avatar" />
        </v-avatar>
      </v-col>

      <v-col class="ma-0 pa-0 flex-shrink-1 flex-nowrap" style="overflow:hidden;cursor:pointer" @click.stop="onHeaderClicked">
        <div class="d-flex flex-nowrap room-name-inline">{{ room.summary.info.title }} <!--<v-icon>expand_more</v-icon>--></div>
        <div class="num-members">{{ $tc('room.members', memberCount) }}</div>
      </v-col>
      <v-col cols="auto" class="text-end ma-0 pa-0">
        <v-btn text class="leave-button" @click.stop="leaveRoom">{{$t('room.leave')}}</v-btn>
      </v-col>
      <v-col cols="auto" class="text-end ma-0 pa-0 ml-2">
        <v-avatar class="avatar-32 clickable" size="32" color="#e0e0e0" @click.stop="showProfileInfo = true">
          <img v-if="userAvatar" :src="userAvatar" />
            <span v-else class="white--text">{{
              userAvatarLetter
            }}</span>
          </v-avatar>
      </v-col>
    </v-row>

    <!-- "REALLY LEAVE?" dialog -->
    <LeaveRoomDialog :show="showLeaveConfirmation" :room="room" @close="showLeaveConfirmation = false" />

    <!-- PROFILE INFO POPUP -->
    <ProfileInfoPopup :show="showProfileInfo" @close="showProfileInfo = false" />

  </v-container>
</template>

<script>
import LeaveRoomDialog from '../components/LeaveRoomDialog';
import ProfileInfoPopup from '../components/ProfileInfoPopup';
import profileInfoMixin from '../components/profileInfoMixin';

export default {
  name: "ChatHeader",
  mixins: [profileInfoMixin],
  components: {
    LeaveRoomDialog,
    ProfileInfoPopup
  },
  data() {
    return {
      memberCount: null,
      showLeaveConfirmation: false,
      showProfileInfo: false
    };
  },
  mounted() {
    this.$matrix.on("Room.timeline", this.onEvent);
    this.updateMemberCount();
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
  },

  computed: {
    room() {
      return this.$matrix.currentRoom;
    },
  },

  watch: {
    room: {
      handler(newVal, ignoredOldVal) {
        if (newVal) {
          this.memberCount = newVal.getJoinedMemberCount();
        } else {
          this.memberCount = null;
        }
      },
    },
  },

  methods: {
    onEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      if (event.getType() == "m.room.member") {
        this.updateMemberCount();
      }
    },
    
    onHeaderClicked() {
      this.$emit("header-click", {event: this.event});
    },

    updateMemberCount() {
      if (!this.room) {
        this.memberCount = 0;
      } else {
        this.memberCount = this.room.getJoinedMemberCount();
      }
    },

    leaveRoom() {
      this.showLeaveConfirmation = true;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>