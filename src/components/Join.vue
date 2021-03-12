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
        <v-row v-if="canEditProfile">
          <v-col class="flex-grow-0 flex-shrink-0">
            <v-avatar @click="showAvatarPickerList">
              <v-img v-if="profile" :src="profile.image" />
            </v-avatar>
          </v-col>
          <v-col class="flex-shrink-1 flex-grow-1">
            <v-select
              ref="avatar"
              :items="availableAvatars"
              cache-items
              label="User name"
              outlined
              dense
              @change="selectAvatar"
              :value="availableAvatars[0]"
              single-line
            >
              <template v-slot:selection>
                <v-text-field
                  background-color="transparent"
                  solo
                  flat
                  hide-details
                  @click.native.stop="
                    {
                    }
                  "
                  v-model="profile.name"
                ></v-text-field>
              </template>
              <template v-slot:item="data">
                <v-avatar size="32">
                  <v-img :src="data.item.image" />
                </v-avatar>
                <div class="ml-2">{{ data.item.name }}</div>
              </template>
            </v-select>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col>
            You are joining as:
            <div style="display: inline-block">
              <v-avatar color="#e0e0e0" style="">
                <v-img v-if="userAvatar" :src="userAvatar" />
                <span v-else class="white--text headline">{{
                  userAvatarLetter
                }}</span>
              </v-avatar>
            </div>
            {{ userDisplayName }}
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
  </div>
</template>

<script>
import User from "../models/user";
import util from "../plugins/utils";
import config from "../assets/config";

export default {
  name: "Join",
  data() {
    return {
      roomName: null,
      roomAvatar: null,
      guestUser: new User(config.defaultServer, "", "", true),
      loading: false,
      loadingMessage: null,
      waitingForInfo: true,
      waitingForMembership: false,
      availableAvatars: [],
      randomProfile: null,
      selectedProfile: null,
    };
  },
  mounted() {
    this.$matrix.on("Room.myMembership", this.onMyMembership);
    this.availableAvatars = util.getDefaultAvatars();
    this.randomProfile = this.availableAvatars[
      Math.floor(Math.random() * this.availableAvatars.length)
    ];
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

    profile() {
      return {
        image:
          (this.selectedProfile ? this.selectedProfile.image : null) ||
          this.userAvatar ||
          this.randomProfile.image,
        name:
          (this.selectedProfile ? this.selectedProfile.name : null) ||
          this.userDisplayName ||
          this.randomProfile.name,
      };
    },

    canEditProfile() {
      // If we have an account already, we can't edit profile here (need to go into profile view)
      if (this.currentUser) {
        return false;
      }
      return true;
    },

    hasChangedAvatar() {
      return this.userAvatar != this.profile.image;
    },

    hasChangedDisplayName() {
      return this.userDisplayName != this.profile.name;
    },

    userDisplayName() {
      return this.$matrix.userDisplayName;
    },

    userAvatar() {
      if (!this.$matrix.userAvatar) {
        return null;
      }
      return this.$matrix.matrixClient.mxcUrlToHttp(
        this.$matrix.userAvatar,
        80,
        80,
        "scale",
        true
      );
    },

    userAvatarLetter() {
      if (!this.currentUser || !this.currentUser.userId) {
        return null;
      }
      return (this.userDisplayName || this.currentUser.userId.substring(1))
        .substring(0, 1)
        .toUpperCase();
    },
  },
  watch: {
    roomId: {
      immediate: true,
      handler(value, oldVal) {
        if (!value || (value && value == oldVal)) {
          return; // No change.
        }
        console.log(
          "Join: Current room changed to " + (value ? value : "null")
        );
        this.roomName = this.roomId;

        this.waitingForInfo = true;
        const self = this;
          this.waitingForMembership = true;
        if (this.currentUser) {
          this.getLoginPromise()
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
          })
          .catch(err => {
            console.log("Error logging in: ", err)
          })
          .finally(() => {
            this.waitingForMembership = false;
            this.getRoomInfo();
          });
        } else {
          this.waitingForMembership = false;
          this.getRoomInfo();
        }
      }
    },
  },

  methods: {
    /**
     * Returns a promise that will log us into the Matrix.
     * 
     * Will use a real account, if we have one, otherwise will create
     * a random account.
     */
    getLoginPromise() {
        return this.$store.dispatch("auth/login", this.currentUser || this.guestUser);
    },

    getRoomInfo() {
      if (this.roomId.startsWith("#")) {
        this.$matrix
          .getPublicRoomInfo(this.roomId)
          .then((room) => {
            console.log("Found room:", room);
            this.roomName = room.name;
            this.roomAvatar = room.avatar;
          })
          .catch((err) => {
            console.log("Could not find room info", err);
          })
          .finally(() => {
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
      return this.getLoginPromise()
        .then(
          function (user) {
            if (!this.hasChangedDisplayName) {
              console.log("Join: No display name change");
              return Promise.resolve(user);
            } else {
              console.log("Join: Set display name to: " + this.profile.name);
              return this.$matrix.matrixClient.setDisplayName(
                this.profile.name,
                undefined
              );
            }
          }.bind(this)
        )
        .then(
          function () {
            if (!this.hasChangedAvatar) {
              console.log("Join: No avatar change");
              return Promise.resolve("no avatar");
            } else {
              console.log("Join: Updating avatar");
              return util.setAvatar(
                this.$matrix.matrixClient,
                this.profile.image,
                function (progress) {
                  console.log("Progress: " + JSON.stringify(progress));
                }
              );
            }
          }.bind(this)
        )
        .then(
          function (ignoreduser) {
            console.log("Join: joining room");
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

    selectAvatar(value) {
      this.selectedProfile = Object.assign({}, value); // Make a copy, so editing does not destroy data
    },

    showAvatarPickerList() {
      this.$refs.avatar.$refs.input.click();
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/join.scss";
</style>