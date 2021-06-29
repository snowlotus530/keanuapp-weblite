<template>
  <div class="create-room">
    <div>
      <v-container fluid>
        <div class="room-name">{{ $t("new_room.new_room") }}</div>
        <v-btn
          text
          class="header-button-left"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="goBack"
          :disabled="step > steps.NAME_SET"
        >
          <v-icon>arrow_back</v-icon>
          <span>{{ $t("menu.back") }}</span>
        </v-btn>
        <!-- <v-btn
          text
          :disabled="
            !roomName || (step != steps.INITIAL && step != steps.CREATED)
          "
          class="header-button-right"
          @click.stop="next"
        >
          <span>{{
            step == steps.CREATED ? $t("new_room.done") : $t("new_room.next")
          }}</span>
        </v-btn> -->
      </v-container>
    </div>
    <v-container class="join-user-info">
      <v-row v-if="canEditProfile">
        <v-col class="flex-grow-0 flex-shrink-0">
          <v-avatar @click="showAvatarPickerList">
            <v-img v-if="selectedProfile" :src="selectedProfile.image" />
          </v-avatar>
        </v-col>
        <v-col class="flex-shrink-1 flex-grow-1">
          <v-select
            ref="avatar"
            :items="availableAvatars"
            cache-items
            :label="$t('join.user_name_label')"
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
                v-model="selectedProfile.name"
              ></v-text-field>
            </template>
            <template v-slot:item="data">
              <v-avatar size="32">
                <v-img :src="data.item.image" />
              </v-avatar>
              <div class="ms-2">{{ data.item.name }}</div>
            </template>
          </v-select>
          <v-switch
            v-model="sharedComputer"
            :label="$t('join.shared_computer')"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-container fluid style="margin-top: 40px">
      <v-row align="center">
        <v-col align="center">
          <v-avatar size="50" color="#ededed" @click.stop="showAvatarPicker">
            <v-img v-if="roomAvatar" :src="roomAvatar" />
            <v-icon v-else>camera_alt</v-icon>
          </v-avatar>
        </v-col>
      </v-row>
      <v-row cols="12" align="center">
        <v-col cols="8" offset="2" align="center">
          <v-text-field
            v-model="roomName"
            :label="$t('new_room.name_room')"
            color="black"
            background-color="white"
            v-on:keyup.enter="$refs.topic.focus()"
            :disabled="step > steps.INITIAL"
          ></v-text-field>
          <v-text-field
            v-model="roomTopic"
            v-show="roomName.length > 0"
            :label="$t('new_room.room_topic')"
            color="black"
            background-color="white"
            v-on:keyup.enter="$refs.create.focus()"
            :disabled="step > steps.INITIAL"
          ></v-text-field>
          <v-btn
            color="black"
            depressed
            class="filled-button"
            @click.stop="next"
            :disabled="roomName.length == 0"
            >{{ $t("new_room.create") }}</v-btn
          >
        </v-col>
      </v-row>
    </v-container>

    <v-fade-transition>
      <!-- <div class="section ma-3" flat v-if="step > steps.INITIAL"> -->
      <!--    <div class="h4 text-left">{{ $t("new_room.join_permissions") }}</div>
        <div class="h2 text-left">
          {{ $t("new_room.set_join_permissions") }}
        </div>
        <div>{{ $t("new_room.join_permissions_info") }}</div>
        <v-select
          :disabled="step >= steps.CREATING"
          :items="joinRules"
          class="mt-4"
          v-model="joinRule"
          item-value="id"
        >
          <template v-slot:selection="{ item }">
            {{ item.text }}
          </template>
          <template v-slot:item="{ item, attrs, on }">
            <v-list-item v-on="on" v-bind="attrs" #default="{ active }">
              <v-list-item-avatar>
                <v-icon class="grey lighten-1" dark>{{ item.icon }}</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="item.text"></v-list-item-title>
                <v-list-item-subtitle
                  v-text="item.descr"
                ></v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon v-if="active">
                  <v-icon color="grey lighten-1">check</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </template>
        </v-select>

        <v-divider style="margin-bottom: 20px" />

        <v-text-field
          v-if="publicRoomLink"
          :value="publicRoomLink"
          class="room-link"
          readonly
          filled
          background-color="transparent"
          append-icon="content_copy"
          type="text"
          @click:append.stop="copyRoomLink"
        ></v-text-field>
        <v-btn
          v-else-if="joinRule == 'public'"
          :loading="step == steps.CREATING"
          block
          depressed
          class="outlined-button"
          @click.stop="getPublicLink"
          ><v-icon class="me-2">link</v-icon
          >{{ $t("new_room.get_link") }}</v-btn
        >
        <v-btn
          v-else-if="joinRule == 'invite'"
          block
          depressed
          class="outlined-button"
          @click.stop="addPeople"
          ><v-icon class="me-2">person_add</v-icon
          >{{ $t("new_room.add_people") }}</v-btn
        >

        <div v-if="publicRoomLinkCopied" class="link-copied">
          {{ $t("new_room.link_copied") }}
        </div>
-->
      <div v-if="status" class="text-center">
        <v-progress-circular
          v-if="step == steps.CREATING"
          indeterminate
          color="primary"
          size="20"
        ></v-progress-circular>
        {{ status }}
      </div>
      <!-- </div> -->
    </v-fade-transition>
    <input
      ref="avatar"
      type="file"
      name="avatar"
      @change="handlePickedAvatar($event)"
      accept="image/*"
      style="display: none"
    />
  </div>
</template>

<script>
import util from "../plugins/utils";

const steps = Object.freeze({
  INITIAL: 0,
  //NAME_SET: 1,
  CREATING: 2,
  CREATED: 3,
});

export default {
  name: "CreateRoom",
  data() {
    return {
      steps,
      step: steps.INITIAL,
      roomId: null,
      roomName: "",
      roomTopic: "",
      roomAvatar: null,
      roomAvatarFile: null,
      status: "",
      joinRule: 0,
      joinRules: [
        {
          id: "public",
          text: this.$t("new_room.public_info"),
          icon: "link",
          descr: this.$t("new_room.public_description"),
        },
        {
          id: "invite",
          text: this.$t("new_room.invite_info"),
          icon: "person_add",
          descr: this.$t("new_room.invite_description"),
        },
      ],
      publicRoomLink: null,
      publicRoomLinkCopied: false,
      availableAvatars: [],
      selectedProfile: null,
    };
  },

  mounted() {
    this.joinRule = this.joinRules[0].id; // Set default
    this.availableAvatars = util.getDefaultAvatars();
    this.selectAvatar(
      this.availableAvatars[
        Math.floor(Math.random() * this.availableAvatars.length)
      ]
    );
  },

  watch: {
    joinRule() {
      console.log("Join rule changed to", this.joinRule);
    },
  },
  computed: {
    roomAvatarLetter() {
      if (!this.roomName) {
        return null;
      }
      return this.roomName.substring(0, 1).toUpperCase();
    },
    currentUser() {
      return this.$store.state.auth.user;
    },
    canEditProfile() {
      // If we have an account already, we can't edit profile here (need to go into profile view)
      if (this.currentUser) {
        return false;
      }
      return true;
    },
  },

  methods: {
    goBack() {
      if (this.step == steps.NAME_SET) {
        this.step = steps.INITIAL;
      } else {
        this.$navigation.pop();
      }
    },
    next() {
      if (this.step == steps.CREATED) {
        this.openRoom();
      } else if (this.step == steps.INITIAL) {
        //  this.step = steps.NAME_SET;
        //} else if (this.step == steps.NAME_SET) {
        // Create room with deafult setting
        this.createRoom().then((roomId) => {
          this.roomId = roomId;
          this.openRoom(); // Open room (if id is set!)
        });
      }
    },

    openRoom() {
      if (this.roomId) {
        this.$navigation.push(
          {
            name: "Chat",
            params: { roomId: util.sanitizeRoomId(this.roomId) },
          },
          -1
        );
      }
    },

    getPublicLink() {
      this.createRoom().then((roomId) => {
        this.roomId = roomId;
        var room = null;
        if (roomId) {
          room = this.$matrix.getRoom(roomId);
        }
        if (room) {
          this.publicRoomLink = this.$router.getRoomLink(
            room.getCanonicalAlias() || roomId
          );
        }
      });
    },
    addPeople() {
      // For now, jump straight to create
      this.createRoom().then((roomId) => {
        this.roomId = roomId;
        this.$matrix.setCurrentRoomId(roomId);
        this.$navigation.push(
          {
            name: "Invite",
          },
          1
        );
      });
    },
    createRoom() {
      this.step = steps.CREATING;

      const hasUser = this.currentUser ? true : false;
      var setProfileData = false;

      var uniqueAliasPromise = Promise.resolve(true);

      var roomId;
      this.status = this.$t("new_room.status_creating");
      var createRoomOptions = {};
      if (this.joinRule == "public") {
        createRoomOptions = {
          visibility: "private", // Not listed!
          name: this.roomName,
          preset: "public_chat",
          initial_state: [
            {
              type: "m.room.encryption",
              state_key: "",
              content: {
                algorithm: "m.megolm.v1.aes-sha2",
              },
            },
          ],
        };

        // Promise to get a unique alias and use it in room creation options.
        //
        uniqueAliasPromise = util
          .getUniqueAliasForRoomName(
            this.$matrix.matrixClient,
            this.roomName,
            this.$matrix.currentUserHomeServer
          )
          .then((alias) => {
            createRoomOptions.room_alias_name = alias;
          });
      } else {
        //if (this.joinRule == "invite") {
        createRoomOptions = {
          visibility: "private", // Not listed!
          name: this.roomName,
          preset: "private_chat",
          initial_state: [
            {
              type: "m.room.encryption",
              state_key: "",
              content: {
                algorithm: "m.megolm.v1.aes-sha2",
              },
            },
            {
              type: "m.room.guest_access",
              state_key: "",
              content: {
                guest_access: "forbidden",
              },
            },
          ],
        };
      }
      if (this.roomTopic && this.roomTopic.length > 0) {
        // Add topic
        createRoomOptions.topic = this.roomTopic;
      }

      return this.$matrix
        .getLoginPromise()
        .then(
          function (user) {
            if (user.is_guest && !hasUser) {
              // Newly created account, joining first room.
              // Set avatar and display name to either the randomly chosen ones, or the
              // ones the users has changed to.
              setProfileData = true;

              // Set display name and avatar directly on the matrix object.
              if (
                this.selectedProfile.name &&
                this.selectedProfile.name.length > 0
              ) {
                this.$matrix.userDisplayName = this.selectedProfile.name;
              }
            }

            if (
              !setProfileData ||
              !this.selectedProfile.name ||
              this.selectedProfile.name.length == 0
            ) {
              return Promise.resolve(user);
            } else {
              console.log(
                "CreateRoom: Set display name to: " + this.selectedProfile.name
              );
              return this.$matrix.matrixClient.setDisplayName(
                this.selectedProfile.name,
                undefined
              );
            }
          }.bind(this)
        )
        .then(
          function () {
            if (!setProfileData || !this.selectedProfile.image) {
              console.log("CreateRoom: No avatar change");
              return Promise.resolve("no avatar");
            } else {
              console.log("CreateRoom: Updating avatar");
              return util.setAvatar(
                this.$matrix,
                this.selectedProfile.image,
                function (progress) {
                  console.log("Progress: " + JSON.stringify(progress));
                }
              );
            }
          }.bind(this)
        )
        .then(() => {
          return uniqueAliasPromise;
        })
        .then(() => {
          return this.$matrix.matrixClient
            .createRoom(createRoomOptions)
            .then(({ room_id, room_alias }) => {
              roomId = room_alias || room_id;
              if (!this.roomAvatarFile) {
                return true;
              }
              const self = this;
              return util.setRoomAvatar(
                this.$matrix.matrixClient,
                room_id,
                this.roomAvatarFile,
                function (p) {
                  if (p.total) {
                    self.status = this.$t("new_room.status_avatar_total", {
                      count: p.loaded || 0,
                      total: p.total,
                    });
                  } else {
                    self.status = this.$t("new_room.status_avatar", {
                      count: p.loaded || 0,
                    });
                  }
                }
              );
            });
        })
        .then(() => {
          this.status = "";
          this.step = steps.CREATED;
          return roomId;
        })
        .catch((error) => {
          this.status =
            (error.data && error.data.error) ||
            error.message ||
            error.toString();
          this.step = steps.INITIAL; // revert
          return null;
        });
    },

    /**
     * Show picker to select room avatar file
     */
    showAvatarPicker() {
      if (this.step == steps.INITIAL) {
        this.$refs.avatar.click();
      }
    },

    /**
     * Handle picked avatar
     */
    handlePickedAvatar(event) {
      if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
          this.roomAvatar = e.target.result;
          this.roomAvatarFile = event.target.files[0];
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    },

    copyRoomLink() {
      const self = this;
      this.$copyText(this.publicRoomLink).then(
        function (ignored) {
          // Success!
          self.publicRoomLinkCopied = true;
          setInterval(() => {
            // Hide again
            self.publicRoomLinkCopied = false;
          }, 3000);
        },
        function (e) {
          // Failure!
          console.log(e);
        }
      );
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
@import "@/assets/css/chat.scss";
</style>