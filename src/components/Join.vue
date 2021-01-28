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
      <v-container class="join-user-info">
        <v-row>
          <v-col class="flex-grow-0 flex-shrink-0">
            <v-avatar @click="showAvatarPicker = true">
              <v-img v-if="userAvatar" :src="userAvatar.image" />
            </v-avatar>
          </v-col>
          <v-col class="flex-shrink-1 flex-grow-1">
            <v-combobox
              v-if="!currentUser || currentUser"
              @update:search-input="updateDisplayName"
              :items="defaultDisplayNames"
              :value="displayName"
              label="User name"
              outlined
              dense
            ></v-combobox>
          </v-col>
        </v-row>
      </v-container>

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

    <v-dialog
      scrollable
      :fullscreen="$vuetify.breakpoint.xs"
      width="500"
      transition="dialog-bottom-transition"
      v-model="showAvatarPicker"
    >
      <v-card>
        <v-toolbar dark flat color="primary">
          <v-btn icon dark @click="showAvatarPicker = false">
            <v-icon>close</v-icon>
          </v-btn>
          <v-toolbar-title>Select an Avatar</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
          <v-container row wrap>
            <v-col
              v-for="avatar in availableAvatars"
              :key="avatar.id"
              xs4
              sm3
              d-flex
            >
              <v-card tile flat class="d-flex">
                <v-card-text class="d-flex">
                  <v-avatar
                    size="48"
                    @click="selectAvatar(avatar)"
                    class="avatar-picker-avatar"
                    :class="{ current: avatar === userAvatar }"
                  >
                    <img :src="avatar.image" />
                  </v-avatar>
                </v-card-text>
              </v-card>
            </v-col>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import User from "../models/user";
import util from "../plugins/utils";

export default {
  name: "Join",
  data() {
    return {
      roomName: null,
      roomAvatar: null,
      guestUser: new User("https://neo.keanu.im", "", "", true),
      loading: false,
      loadingMessage: null,
      waitingForInfo: true,
      waitingForMembership: false,
      userAvatar: null,
      displayName: null,
      defaultDisplayNames: [],
      availableAvatars: [],
      showAvatarPicker: false,
    };
  },
  mounted() {
    this.$matrix.on("Room.myMembership", this.onMyMembership);
    this.availableAvatars = util.getDefaultAvatars();
    this.userAvatar = this.availableAvatars[0];
    if (!this.currentUser || this.currentUser.is_guest) {
      var values = require("!!raw-loader!../assets/usernames.txt")
        .default.split("\n")
        .filter((item) => {
          return item.length > 0;
        });
      this.displayName = values[Math.floor(Math.random() * values.length)];
      this.defaultDisplayNames = values;
    }
  },
  destroyed() {
    this.$matrix.off("Room.myMembership", this.onMyMembership);
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    room() {
      return this.$matrix.currentRoom;
    },
    roomId() {
      if (this.room) {
        return this.room.roomId;
      }
      return this.$matrix.currentRoomId;
    },
    roomAliasOrId() {
      if (this.room) {
        return this.room.getCanonicalAlias() || this.room.roomId;
      }
      return this.$matrix.currentRoomId;
    },
  },
  watch: {
    roomId: {
      immediate: true,
      handler(val, oldVal) {
        if (val && val == oldVal) {
          return; // No change.
        }
        console.log("Join: Current room changed");
        this.roomName = this.roomId;
        if (this.currentUser) {
          this.waitingForMembership = true;
          const self = this;
          this.$matrix
            .login(this.currentUser)
            .then(() => {
              self.$matrix.setCurrentRoomId(self.roomAliasOrId); // Go to this room, now or when joined.
              const room = self.$matrix.getRoom(self.roomAliasOrId);

              // Already joined?
              if (
                room &&
                room.hasMembershipState(self.currentUser.user_id, "join")
              ) {
                // Yes, go to room
                self.$navigation.push(
                  {
                    name: "Chat",
                    params: { roomId: util.sanitizeRoomId(this.roomAliasOrId) },
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
    },
  },

  methods: {
    onMyMembership(room, membership, ignoredprevMembership) {
      if (room && room.roomId == this.roomId && membership == "join") {
        this.$nextTick(() => {
          this.$navigation.push(
            {
              name: "Chat",
              params: { roomId: util.sanitizeRoomId(this.roomAliasOrId) },
            },
            -1
          );
        });
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
        clientPromise = this.$matrix.login(this.currentUser);
      } else {
        clientPromise = this.$store.dispatch("auth/login", this.guestUser);
      }
      return clientPromise
        .then(
          function (user) {
            if (
              (this.currentUser && !this.currentUser.is_guest) ||
              !this.displayName
            ) {
              return Promise.resolve(user);
            } else {
              return this.$matrix.matrixClient.setDisplayName(
                this.displayName,
                undefined
              );
            }
          }.bind(this)
        )
        .then(
          function () {
            if (
              (this.currentUser && !this.currentUser.is_guest) ||
              !this.userAvatar
            ) {
              return Promise.resolve("no avatar");
            } else {
              return util.setAvatar(
                this.$matrix.matrixClient,
                this.userAvatar.image,
                function (progress) {
                  console.log("Progress: " + JSON.stringify(progress));
                }
              );
            }
          }.bind(this)
        )
        .then(
          function (ignoreduser) {
            this.loadingMessage = "Joining room...";
            return this.$matrix.matrixClient.joinRoom(this.roomId);
          }.bind(this)
        )
        .then((ignoredRoom) => {
          this.loading = false;
          this.loadingMessage = null;
          this.$nextTick(() => {
            this.$navigation.push(
              {
                name: "Chat",
                params: { roomId: util.sanitizeRoomId(this.roomAliasOrId) },
              },
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

    updateDisplayName(value) {
      this.displayName = value;
    },

    selectAvatar(avatar) {
      this.userAvatar = avatar;
      this.showAvatarPicker = false;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/join.scss";
</style>