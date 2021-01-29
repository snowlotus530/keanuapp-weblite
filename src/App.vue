<template>
  <v-app>
    <!-- <v-app-bar app dark flat color="#008860">
      <v-app-bar-nav-icon @click.stop="openDrawer = !openDrawer">
        <v-icon>menu</v-icon>
      </v-app-bar-nav-icon>

      <v-toolbar-title
        >Keanu{{ $matrix.currentRoom ? (" - " + $matrix.currentRoom.summary.info.title) : "" }}</v-toolbar-title
      >
    </v-app-bar> -->

    <v-navigation-drawer app v-model="openDrawer">
      <v-list nav dense>
        <template v-if="!currentUser && $route.path != '/login'">
          <v-btn
            color="green"
            dark
            @click="openDrawer = false;$navigation.push({ path: '/login' }, -1)"
            ><v-icon>mdi-login</v-icon>Login</v-btn
          >
        </template>
        <template v-else-if="currentUser">
          <div class="ma-2">{{ currentUser.user_id }}</div>
          <v-list-item @click.prevent="logOut">
            <v-list-item-icon><v-icon>logout</v-icon></v-list-item-icon>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </template>

        <RoomList v-if="$matrix.ready" @close="openDrawer = false" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <v-footer app class="copyright">
      <v-btn icon x-small @click.stop="openDrawer = !openDrawer">
        <v-icon>menu</v-icon>
      </v-btn>
      </v-footer
    >
  </v-app>
</template>

<script>
import RoomList from "./components/RoomList";

export default {
  name: "App",
  components: {
    RoomList,
  },
  data: () => ({
    openDrawer: false,
  }),
  mounted() {
    //this.$router.replace("/");
  },
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