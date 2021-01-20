<template>
  <div v-if="room">
    <div class="chat-header">
      <v-container fluid>
        <v-row class="chat-header-row align-center">
          <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
            <v-btn
              v-show="$navigation && $navigation.canPop()"
              icon
              @click.stop="$navigation.pop"
            >
              <v-icon>arrow_back</v-icon>
            </v-btn>
          </v-col>

          <!-- <v-col class="chat-header-members text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
          <v-btn icon class="members-icon" @click.stop="showRoomInfo">
            <v-icon>people</v-icon>
          </v-btn>
          <div class="num-members">{{ memberCount }}</div>
        </v-col> -->

          <v-col class="flex-grow-1 flex-shrink-1 ma-0 pa-0">
            <div class="room-name" v-if="room">
              {{ room.summary.info.title }}
            </div>
          </v-col>
          <!-- <v-col class="text-center flex-grow-0 flex-shrink-1 ma-0 pa-0">
          <v-btn class="leave-button">Leave</v-btn>
        </v-col> -->
        </v-row>
      </v-container>
    </div>

    <v-card class="members ma-3">
      <v-card-title
        >Members<v-spacer></v-spacer>
        <div>{{ room.getJoinedMemberCount() }}</div></v-card-title
      >
      <v-card-text>
        <div
          class="member ma-2"
          v-for="member in room.getJoinedMembers()"
          :key="member.userId"
        >
          <v-avatar class="avatar" size="40" color="grey">
            <img v-if="memberAvatar(member)" :src="memberAvatar(member)" />
            <span v-else class="white--text headline">{{
              member.name.substring(0, 1).toUpperCase()
            }}</span>
          </v-avatar>
          {{ member.user ? member.user.displayName : member.name
          }}{{ member.userId == $matrix.currentUserId ? " (you)" : "" }}
          <v-btn
            color="black"
            v-if="member.userId == $matrix.currentUserId"
            text
            absolute
            right
            @click.stop="showEditDialog = true"
            >edit</v-btn
          >
        </div>
      </v-card-text>
    </v-card>

    <v-card class="account ma-3">
      <v-card-title>Your account</v-card-title>
      <v-card-text>
        <div v-if="$matrix.currentUser.is_guest">
          <div>You don't have a Keanu account, yet ;)</div>
          <v-btn dark block @click.stop="upgradeAccount">Login</v-btn>
        </div>
      </v-card-text>
    </v-card>

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