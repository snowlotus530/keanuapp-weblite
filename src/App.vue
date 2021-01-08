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
        <v-btn color="green" dark to="/login" replace
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

        <RoomList
          v-if="$matrix.ready"
          @close="openDrawer = false"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <v-footer app class="copyright">
       <v-btn icon x-small @click.stop="openDrawer = !openDrawer">
        <v-icon>menu</v-icon>
       </v-btn>
      Powered by Guardian Project. Version: {{ buildVersion }}</v-footer>
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
    buildVersion: "",
    openDrawer: false,
  }),
  mounted() {
    //this.$router.replace("/");
    const version = require("!!raw-loader!./assets/version.txt").default;
    console.log("Version", version);
    this.buildVersion = version;
  },
  methods: {
    loggedIn() {
      return this.$store.state.auth.status.loggedIn;
    },
    logOut() {
      this.$store.dispatch("auth/logout");
      this.$navigation.push("/login", true);
    },
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
  },
  watch: {
    currentUser: {
      immediate: true,
      handler(ignorednewVal, ignoredoldVal) {
        if (this.loggedIn()) {
          this.$matrix.getMatrixClient(this.currentUser)
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