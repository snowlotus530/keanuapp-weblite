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


    <v-container class="user-info">
        <v-row>
          <v-col class="flex-grow-0 flex-shrink-0">
                <v-avatar class="avatar" size="48" color="#e0e0e0">
          <img v-if="userAvatar" :src="userAvatar" />
            <span v-else class="white--text headline">{{
              userAvatarLetter
            }}</span>
          </v-avatar>
          </v-col>
          <v-col class="flex-shrink-1 flex-grow-1">
            <div class="h1">{{ displayName }}</div>
            <div v-if="$matrix.currentUser.is_guest">
              This identity is temporary. Set a password to use it again.
          </div>
          </v-col>
        </v-row>
      </v-container>

    <div class="action" @click="showEditPasswordDialog = true"><v-icon>lock</v-icon><span>Set password</span></div>
    <div class="action" @click="editValue = displayName;showEditDisplaynameDialog = true"><v-icon>edit</v-icon><span>Change name</span></div>

    <!-- edit password dialog -->
    <v-dialog v-model="showEditPasswordDialog" class="ma-0 pa-0" width="50%">
      <v-card>
        <v-card-title>Change password</v-card-title>
        <v-card-text>
          Not yet implemented.
          <!-- <v-text-field v-model="password" /> -->
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showEditPasswordDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="
              showEditPasswordDialog = false;
            "
            >Ok</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- edit display name dialog -->
    <v-dialog v-model="showEditDisplaynameDialog" class="ma-0 pa-0" width="50%">
      <v-card>
        <v-card-title>Display name</v-card-title>
        <v-card-text>
          <v-text-field v-model="editValue" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showEditDisplaynameDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="
              setDisplayName(editValue);
              showEditDisplaynameDialog = false;
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
      showEditPasswordDialog: false,
      showEditDisplaynameDialog: false,
      editValue: null,
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

    user() {
      return this.$matrix.matrixClient.getUser(this.$matrix.currentUserId);
    },

    displayName() {
      if (!this.user) {
        return null;
      }
      return (this.user.displayName || this.user.userId);
    },

    userAvatar() {
      if (!this.user || !this.user.avatarUrl) {
        return null;
      }
      return this.$matrix.matrixClient.mxcUrlToHttp(this.user.avatarUrl, 80, 80, 'scale', true);
    },

    userAvatarLetter() {
      if (!this.user) {
        return null;
      }
      return (this.user.displayName || this.user.userId.substring(1)).substring(0, 1).toUpperCase();
    }
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

    setDisplayName(name) {
      this.$matrix.matrixClient.setDisplayName(name);
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