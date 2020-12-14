<template>
  <div class="d-flex justify-center login-root">
    <div v-if="!waiting">
      <h4>Join room</h4>
      <div>You have been invited to the room {{ roomId }}</div>

      <v-btn primary large block @click.stop="handleJoin" :loading="loading"
        >Join as guest</v-btn
      >

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
      guestUser: new User("https://neo.keanu.im", "", "", true),
      loading: false,
      loadingMessage: null,
      waiting: false
    };
  },
  mounted() {
    this.roomId = this.$route.hash;
    if (this.currentUser) {
        this.waiting = true;
        const self = this;
        this.$matrix.getMatrixClient(this.currentUser)
        .then(() => {
          // Already joined?
          const room = self.$matrix.getRoom(self.roomId);
          if (room && room.hasMembershipState(self.currentUser.user_id, "join")) {
            // Yes, go to room
            self.$matrix.setCurrentRoom(room);
            self.$router.replace({ name: "Chat" });
            return;
          }

          this.waiting = false;
        })
        .catch(ignoredErr => {
          this.waiting = false;
        });
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
  },
  methods: {
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
@import "@/assets/css/login.scss";
</style>