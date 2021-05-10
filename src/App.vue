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
  mounted() {
    if (window.location.protocol == "http" && !window.location.hostname.endsWith('.onion')) {
      // Redirect to HTTPS
      window.location.href = window.location.href.replace("http:", "https:");
      return;
    }
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
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    title() {
      var title = "Keanu Weblite";
      if (this.$matrix.notificationCount > 0) {
        title += " [" + this.$matrix.notificationCount + "]";
      }
      if (this.$route.meta.title) {
        title += "  - " + this.$route.meta.title;
      }
      if (this.$route.meta.includeRoom) {
        if (this.$matrix.currentRoom) {
          title +=
            " - " +
            (this.$matrix.currentRoom.summary.info.title ||
              this.$matrix.currentRoom.roomId);
        } else if (this.$matrix.currentRoomId) {
          title += " - " + this.$matrix.currentRoomId;
        }
      }
      return title;
    },
  },
  watch: {
    title(title) {
      document.title = title;
    },
  },
};
</script>

<style lang="scss">
.copyright {
  font-size: 10px;
}
</style>