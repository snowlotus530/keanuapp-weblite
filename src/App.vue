<template>
  <v-app>
    <v-app-bar app dark>
      <v-app-bar-nav-icon @click.stop="openDrawer = !openDrawer">
        <v-icon>menu</v-icon>
      </v-app-bar-nav-icon>

      <v-toolbar-title
        >Keanu{{ room ? " - " + room.name : "" }}</v-toolbar-title
      >

      <v-spacer></v-spacer>

      <template v-if="!currentUser && $route.path != '/login'">
        <v-btn color="green" dark to="/login" replace
          ><v-icon>mdi-login</v-icon>Login</v-btn
        >
      </template>
      <template v-else-if="currentUser">
        <span class="ma-2">{{ currentUser.name }}</span>
        <v-menu bottom left>
          <template v-slot:activator="{ on, attrs }">
            <v-btn dark icon v-bind="attrs" v-on="on">
              <v-icon>settings</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click.prevent="logOut">
              <v-list-item-icon><v-icon>logout</v-icon></v-list-item-icon>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <!-- <v-btn color="green" dark @click.prevent="logOut" replace><v-icon>mdi-logout</v-icon>Logout</v-btn> -->
      </template>
    </v-app-bar>

    <v-navigation-drawer app v-model="openDrawer">
      <v-list nav dense>
        <RoomList
          v-if="$matrixClient != null"
          v-on:onCurrentRoomChanged="onCurrentRoomChanged"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <v-footer app class="copyright">Powered by Guardian Project</v-footer>
  </v-app>
</template>

<script>
import Vue from "vue";
import RoomList from "./components/RoomList";

export default {
  name: "App",
  components: {
    RoomList,
  },
  data: () => ({
    openDrawer: false,
    currentRoom: null,
  }),
  mounted() {
    this.$router.replace("/");
  },
  methods: {
    loggedIn() {
      return this.$store.state.auth.status.loggedIn;
    },
    logOut() {
      this.$store.dispatch("auth/logout");
      this.$router.replace("/login");
      this.$store.commit("setCurrentRoom", null);
    },
    onCurrentRoomChanged(room) {
      this.$store.commit("setCurrentRoom", room);
    },
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    room() {
      return this.$store.state.currentRoom;
    },
  },
  watch: {
    currentUser: {
      immediate: true,
      handler(ignorednewVal, ignoredoldVal) {
        if (this.loggedIn) {
          this.$matrix.getMatrixClient(this.currentUser)
            .then((matrixClient) => {
              Vue.prototype.$matrixClient = matrixClient;
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