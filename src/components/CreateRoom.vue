<template>
  <div class="create-room">
    <div>
      <v-container fluid>
        <div class="room-name">New Group</div>
        <v-btn
          text
          class="header-button-left"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="goBack"
          :disabled="step > steps.NAME_SET"
        >
          <v-icon>arrow_back</v-icon>
          <span>BACK</span>
        </v-btn>
        <v-btn
          text
          :disabled="
            !roomName || (step != steps.INITIAL && step != steps.CREATED)
          "
          class="header-button-right"
          @click.stop="next"
        >
          <span>{{ step == steps.CREATED ? "Done" : "Next" }}</span>
        </v-btn>
      </v-container>
    </div>

    <v-container fluid style="margin-top: 40px">
      <v-row>
        <v-col cols="auto">
          <v-avatar size="50" color="#ededed" @click.stop="showAvatarPicker">
            <v-img v-if="roomAvatar" :src="roomAvatar" />
            <v-icon v-else>camera_alt</v-icon>
          </v-avatar>
        </v-col>
        <v-col>
          <v-text-field
            v-model="roomName"
            label="Name group"
            color="black"
            background-color="white"
            v-on:keyup.enter="$refs.topic.focus()"
            :disabled="step > steps.INITIAL"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>

    <v-fade-transition>
      <div class="section ma-3" flat v-if="step > steps.INITIAL">
        <div class="h4 text-left">Join permissions</div>
        <div class="h2 text-left">Set Join Permissions</div>
        <div>
          These permissions determine how people can join the group and how
          easily others can be invited. They can be changed anytime.
        </div>
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
          <template v-slot:item="{ active, item, attrs, on }">
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
          ><v-icon class="mr-2">link</v-icon>Get link</v-btn
        >
        <v-btn
          v-else-if="joinRule == 'invite'"
          block
          depressed
          class="outlined-button"
          @click.stop="addPeople"
          ><v-icon class="mr-2">person_add</v-icon>Add people</v-btn
        >

        <div v-if="publicRoomLinkCopied" class="link-copied">Link copied!</div>

        <div v-if="status">{{ status }}</div>
      </div>
    </v-fade-transition>
  </div>
</template>

<script>
import util from "../plugins/utils";

const steps = Object.freeze({
  INITIAL: 0,
  NAME_SET: 1,
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
          text: "Anyone with a link",
          icon: "link",
          descr: "Get a link to share",
        },
        {
          id: "invite",
          text: "Only people added",
          icon: "person_add",
          descr: "Choose from a list or search by account ID",
        },
      ],
      publicRoomLink: null,
      publicRoomLinkCopied: false,
    };
  },

  mounted() {
    this.joinRule = this.joinRules[0].id; // Set default
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
        this.step = steps.NAME_SET;
      } else if (this.step == steps.NAME_SET) {
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
            name: "Invite"
          },
          1
        );
      });
    },
    createRoomDebug() {
      this.step = steps.CREATING;
      return new Promise((resolve, ignoredreject) => {
        setTimeout(() => {
          this.step = steps.CREATED;
          resolve("#NpexPublicRoom2:neo.keanu.im");
        }, 5000);
      });
    },
    createRoom() {
      this.step = steps.CREATING;
      var roomId;
      this.status = "Creating room";
      var createRoomOptions = {};
      if (this.joinRule == "public") {
        createRoomOptions = {
          visibility: "private", // Not listed!
          room_alias_name: this.roomName.replace(/\s/g, "").toLowerCase(),
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
                self.status =
                  "Uploading avatar: " + (p.loaded || 0) + " of " + p.total;
              } else {
                self.status = "Uploading avatar: " + (p.loaded || 0);
              }
            }
          );
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
          this.step = steps.NAME_SET; // revert
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
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>