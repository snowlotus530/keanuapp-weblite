<template>
  <div class="join-root">
    <div v-if="!waiting" class="text-center">
      <v-btn
        class="btn-login"
        text
        small
        @click.stop="handleLogin"
        :loading="loading"
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
        Join the group chat in a web browser or with the Keanu app.
      </div>
      <v-btn
        class="btn-light"
        large
        block
        @click.stop="handleOpenApp"
        :loading="loading"
        >Open Keanu app</v-btn
      >

      <div class="join-or-divider">OR</div>

      <v-btn
        class="btn-dark"
        large
        block
        @click.stop="handleJoin"
        :loading="loading"
        >Join as guest</v-btn
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
      waiting: true,
    };
  },
  mounted() {
    this.roomId = this.$route.hash;
    this.roomName = this.roomId;
    if (this.currentUser) {
      this.waiting = true;
      const self = this;
      this.$matrix
        .getMatrixClient(this.currentUser)
        .then(() => {
          // Already joined?
          const room = self.$matrix.getRoom(self.roomId);
          if (
            room &&
            room.hasMembershipState(self.currentUser.user_id, "join")
          ) {
            // Yes, go to room
            self.$matrix.setCurrentRoom(room);
            self.$router.replace({ name: "Chat" });
            return;
          }

          this.waiting = false;
        })
        .catch((ignoredErr) => {
          this.waiting = false;
        });
    }

    this.$matrix
      .getPublicRoomInfo(this.roomId)
      .then((room) => {
        console.log("Found room:", room);
        this.roomName = room.name;
        this.roomAvatar = room.avatar;
        this.waiting = false;
      })
      .catch((err) => {
        console.log("Could not find room info", err);
        this.waiting = false;
      });
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
  },
  methods: {
    handleLogin() {
      this.$router.push("/login"); // TODO - replace?
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
          this.$matrix.setCurrentRoom(room);
          this.loading = false;
          this.loadingMessage = null;
          this.$router.replace({ name: "Chat" });
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