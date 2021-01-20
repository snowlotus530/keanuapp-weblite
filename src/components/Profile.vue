<template>
  <div v-if="room" class="profile">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name">My Profile</div>
            <v-btn
              text
              class="back"
              v-show="$navigation && $navigation.canPop()"
              @click.stop="$navigation.pop"
            >
              <v-icon>close</v-icon>
            </v-btn>

      </v-container>
    </div>

    <div @click="showEditDialog = true"><v-icon>lock</v-icon><span>Set password</span></div>

    <!-- EDIT dialog -->
    <v-dialog v-model="showEditDialog" class="ma-0 pa-0" width="50%">
      <v-card>
        <v-card-title>Display name</v-card-title>
        <v-card-text>
          <v-text-field v-model="displayName" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showEditDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="
              $matrix.matrixClient.setDisplayName(displayName);
              showEditDialog = false;
            "
            >Ok</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "RoomInfo",
  data() {
    return {
      memberCount: null,
      showEditDialog: false,
      user: null,
      displayName: "",
    };
  },
  mounted() {
    this.$matrix.on("Room.timeline", this.onEvent);
    this.updateMemberCount();
    this.user = this.$matrix.matrixClient.getUser(this.$matrix.currentUserId);
    this.displayName = this.user.displayName;
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
        console.log("RoomInfo: Current room changed");
        this.memberCount = newVal.getJoinedMemberCount();
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

    updateMemberCount() {
      this.memberCount = this.room.getJoinedMemberCount();
    },

    showRoomInfo() {},

    memberAvatar(member) {
      if (member) {
        return member.getAvatarUrl(
          this.$matrix.matrixClient.getHomeserverUrl(),
          40,
          40,
          "scale",
          true
        );
      }
      return null;
    },

    viewProfile() {

    },

    upgradeAccount() {
      this.$matrix
        .upgradeGuestAccount()
        .then(user => {
          // Done, login with the "new" account to get a real token instead of our guest token.
          this.user = user;
          return this.$store.dispatch("auth/login", this.user);
        })
        .then(() => {
          console.log("Upgrade done!");
        })
        .catch((err) => {
          console.log("ERROR", err);
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>