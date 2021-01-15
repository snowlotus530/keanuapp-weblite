<template>
  <div class="join-root">
    <div v-if="!waitingForInfo && !waitingForMembership" class="text-center">
      <v-btn
        class="btn-login"
        text
        small
        @click.stop="handleLogin"
        :loading="loading"
        v-if="!currentUser"
        >Login</v-btn
      >

      <v-avatar class="join-avatar">
        <v-img v-if="roomAvatar" :src="roomAvatar" />
        <span v-else class="white--text headline">{{
          roomName.substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>
      <div class="join-title">Welcome to {{ roomName }}</div>
      <div class="join-message">
        <!-- Join the group chat in a web browser or with the Keanu app. -->
      </div>
      <!--<v-btn
        class="btn-light"
        large
        block
        @click.stop="handleOpenApp"
        :loading="loading"
        >Open Keanu app</v-btn
      >

      <div class="join-or-divider">OR</div> -->

      <v-btn
        class="btn-dark"
        large
        block
        @click.stop="handleJoin"
        :loading="loading"
        v-if="!currentUser"
        >Join as guest</v-btn
      >
      <v-btn
        class="btn-dark"
        large
        block
        @click.stop="handleJoin"
        :loading="loading"
        v-else
        >Join room</v-btn
      >

      <div class="join-privacy">
        Enhance your physical privacy. <a href="#">Learn how</a>
      </div>

      <div v-if="loadingMessage">{{ loadingMessage }}</div>
    </div>
  </div>
</template>

<script>
import User from "../models/user";
import util from "../plugins/utils";

export default {
  name: "Join",
  data() {
    return {
      roomId: null,
      roomName: null,
      roomAvatar: null,
      guestUser: new User("https://neo.keanu.im", "", "", true),
      loading: false,
      loadingMessage: null,
      waitingForInfo: true,
      waitingForMembership: false,
    };
  },
  mounted() {
    this.$matrix.on("Room.myMembership", this.onMyMembership);

    this.roomId = this.$matrix.currentRoomId;
    this.roomName = this.roomId;
    if (this.currentUser) {
      this.waitingForMembership = true;
      const self = this;
      this.$matrix
        .getMatrixClient(this.currentUser)
        .then(() => {
          self.$matrix.setCurrentRoomId(self.roomId); // Go to this room, now or when joined.

          // Already joined?
          const room = self.$matrix.getRoom(self.roomId);
          if (
            room &&
            room.hasMembershipState(self.currentUser.user_id, "join")
          ) {
            // Yes, go to room
            self.$navigation.push(
              {
                name: "Chat",
                params: { roomId: util.sanitizeRoomId(self.roomId) },
              },
              -1
            );
            return;
          }
          this.waitingForMembership = false;
        })
        .catch((ignoredErr) => {
          this.waitingForMembership = false;
        });
    }

    if (this.roomId.startsWith("#")) {
      this.$matrix
        .getPublicRoomInfo(this.roomId)
        .then((room) => {
          console.log("Found room:", room);
          this.roomName = room.name;
          this.roomAvatar = room.avatar;
          this.waitingForInfo = false;
        })
        .catch((err) => {
          console.log("Could not find room info", err);
          this.waitingForInfo = false;
        });
    } else {
      // Private room, try to get name
      const room = this.$matrix.getRoom(this.roomId);
      if (room) {
        this.roomName = room.name || this.roomName;
      }
      this.waitingForInfo = false;
    }
  },
  destroyed() {
    this.$matrix.off("Room.myMembership", this.onMyMembership);
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
  },
  methods: {
    onMyMembership(room, membership, ignoredprevMembership) {
      if (room && room.roomId == this.roomId && membership == "join") {
        this.$navigation.push({ name: "Chat", params: { roomId: this.roomId } },-1);
      }
    },

    handleLogin() {
      this.$navigation.push({ name: "Login" }, 1);
    },

    handleOpenApp() {
      console.log("Open app..."); //TODO
    },

    handleJoin() {
      this.loading = true;
      this.loadingMessage = "Logging in...";
      var clientPromise;
      if (this.currentUser) {
        clientPromise = this.$matrix.getMatrixClient(this.currentUser);
      } else {
        clientPromise = this.$store.dispatch("auth/login", this.guestUser);
      }
      return clientPromise
        .then((ignoreduser) => {
          this.loadingMessage = "Joining room...";
          return this.$matrix.matrixClient.joinRoom(this.roomId);
        })
        .then((room) => {
          this.loading = false;
          this.loadingMessage = null;
          this.$nextTick(() => {
            this.$navigation.push(
              { name: "Chat", params: { roomId: room.roomId } },
              -1
            );
          });
        })
        .catch((err) => {
          // TODO - handle error
          console.log("Failed to join room", err);
          this.loading = false;
          this.loadingMessage = err.toString();
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/join.scss";
</style>