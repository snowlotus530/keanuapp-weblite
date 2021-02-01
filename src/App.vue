<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",
  methods: {
    loggedIn() {
      return this.$store.state.auth.status.loggedIn;
    },
    logOut() {
      this.openDrawer = false;
      this.$store.dispatch("auth/logout");
      this.$nextTick(() => {
        this.$navigation.push({path: "/login"}, -1);
      })
    },
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
  },
  watch: {
    '$route' (to, ignoredFrom) {
      var title = "Keanu Weblite";
      if (to.meta.title) {
        title += "  - " + to.meta.title;
      }
      if (to.meta.includeRoom) {
        if (this.$matrix.currentRoom) {
          title += " - " + (this.$matrix.currentRoom.summary.info.title || this.$matrix.currentRoom.roomId);
        } else if (this.$matrix.currentRoomId) {
          title += " - " + (this.$matrix.currentRoomId);
        }
      }
      document.title = title;
    },
    currentUser: {
      immediate: true,
      handler(ignorednewVal, ignoredoldVal) {
        if (this.currentUser) {
          this.$matrix
            .login(this.currentUser)
            .then(() => {
              console.log("Matrix client ready");
            })
            .catch((error) => {
              console.log("Error creating client", error);
            });
        }
      },
    },
  },
};
</script>

<style lang="scss">
.copyright {
  font-size: 10px;
}
</style>