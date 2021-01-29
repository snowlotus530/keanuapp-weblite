<template>
  <div v-if="room" class="room-info">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name">Info</div>
        <v-btn
          text
          class="back"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="$navigation.pop"
        >
          <v-icon>arrow_back</v-icon>
          <span>BACK</span>
        </v-btn>
      </v-container>
    </div>

    <v-card class="members ma-3 pa-3" flat>
      <div class="text-center">
        <v-avatar class="room-avatar">
          <v-img v-if="roomAvatar" :src="roomAvatar" />
          <span v-else class="white--text headline">{{
            roomName.substring(0, 1).toUpperCase()
          }}</span>
        </v-avatar>
        <div class="h1">{{ roomName }}</div>
        <div class="small">Created by {{ creator }}</div>
        <canvas class="qr" id="room-qr"></canvas>
      </div>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">Permissions</v-card-title>
      <v-card-text>
        <div v-if="anyoneCanJoin">
          <div>
            Anyone with a link can join.
          </div>
          <v-text-field
              :value="roomLink"
              readonly
              append-icon="content_copy"
              filled
              type="text"
              @click:append="copyRoomLink"
            ></v-text-field>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="members ma-3" flat>
      <v-card-title class="h2"
        >Members<v-spacer></v-spacer>
        <div>{{ room.getJoinedMemberCount() }}</div></v-card-title
      >
      <v-card-text>
        <div
          class="member ma-2"
          v-for="(member, index) in joinedMembers"
          :key="member.userId"
          v-show="showAllMembers || index < 5"
        >
          <v-avatar class="avatar" size="32" color="grey">
            <img v-if="memberAvatar(member)" :src="memberAvatar(member)" />
            <span v-else class="white--text headline">{{
              member.name.substring(0, 1).toUpperCase()
            }}</span>
          </v-avatar>
          {{ member.user ? member.user.displayName : member.name
          }}{{ member.userId == $matrix.currentUserId ? " (you)" : "" }}
        </div>
        <div class="show-all" @click="showAllMembers = !showAllMembers">
          {{ showAllMembers ? "Hide" : "Show all" }}
        </div>
      </v-card-text>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">My Profile</v-card-title>
      <v-card-text>
        <div v-if="$matrix.currentUser.is_guest">
          <div>
            Your identity <b>{{ displayName }}</b> is temporary. You can change
            your name or set a password to keep it.
          </div>
          <v-btn block class="outlined-button" @click.stop="viewProfile"
            >View</v-btn
          >
        </div>
      </v-card-text>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-text>
        <v-btn
          color="red"
          block
          class="filled-button"
          @click.stop="showLeaveConfirmation = true"
          >Leave group</v-btn
        >
        <div>
          Note: This step cannot be undone. Make sure you want to logout and
          delete the chat forever.
        </div>
      </v-card-text>
    </v-card>

    <div class="build-version">Powered by Guardian Project. Version: {{ buildVersion }}</div>

    <LeaveRoomDialog
      :show="showLeaveConfirmation"
      :room="room"
      @close="showLeaveConfirmation = false"
    />
  </div>
</template>

<script>
import LeaveRoomDialog from "../components/LeaveRoomDialog";
import QRCode from "qrcode";

export default {
  name: "RoomInfo",
  components: {
    LeaveRoomDialog,
  },
  data() {
    return {
      memberCount: null,
      user: null,
      displayName: "",
      showAllMembers: false,
      showLeaveConfirmation: false,
      buildVersion: "",
    };
  },
  mounted() {
    this.$matrix.on("Room.timeline", this.onEvent);
    this.updateMemberCount();
    this.user = this.$matrix.matrixClient.getUser(this.$matrix.currentUserId);
    this.displayName = this.user.displayName;

    // Set QR code
    this.updateQRCode();

    // Display build version
    const version = require("!!raw-loader!../assets/version.txt").default;
    console.log("Version", version);
    this.buildVersion = version;
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
  },

  computed: {
    room() {
      return this.$matrix.currentRoom;
    },

    creator() {
      if (this.room) {
        const createEvent = this.room.currentState.getStateEvents("m.room.create", "");
        if (!createEvent) {
          console.warn("Room " + this.roomId + " does not have an m.room.create event");
          return '';
        }
        const creatorId = createEvent.getContent().creator;
        const member = this.room.getMember(creatorId);
        if (!member) {
          return creatorId;
        }
        return member.user ? member.user.displayName : member.name;
      }
      return "";
    },

    roomName() {
      if (this.room) {
        return this.room.name;
      }
      return "";
    },

    anyoneCanJoin() {
      // TODO: fix this! For now, just return true of we have a canonical alias.
      if (this.room && this.room.getCanonicalAlias() && this.room.getCanonicalAlias().startsWith('#')) {
        return true;
      }
      return false;
    },

    roomLink() {
      if (this.room) {
        return this.$router.getRoomLink(this.room.getCanonicalAlias() || this.room.roomId);
      }
      return null;
    },

    roomAvatar() {
      if (this.room) {
        return this.room.avatar;
      }
      return "";
    },

    joinedMembers() {
      if (!this.room) {
        return [];
      }
      const myUserId = this.$matrix.currentUserId;
      return this.room.getJoinedMembers().sort((a, b) => {
        if (a.userId == myUserId) {
          return -1;
        } else if (b.userId == myUserId) {
          return 1;
        }
        const aName = a.user ? a.user.displayName : a.name;
        const bName = b.user ? b.user.displayName : b.name;
        return aName.localeCompare(bName);
      });
    },
  },

  watch: {
    room: {
      handler(newVal, ignoredOldVal) {
        console.log("RoomInfo: Current room changed");
        this.memberCount = newVal.getJoinedMemberCount();

        this.updateQRCode();
      },
    },
  },

  methods: {
    onEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      if (event.getType() == "m.room.member") {
        this.updateMemberCount();
      }
    },

    updateMemberCount() {
      this.memberCount = this.room.getJoinedMemberCount();
    },

    updateQRCode() {
      var fullUrl = this.roomLink;
      var canvas = document.getElementById("room-qr");
      QRCode.toCanvas(
        canvas,
        fullUrl,
        {
          type: "image/png",
          margin: 1,
          width: canvas.clientWidth,
        },
        function (error) {
          if (error) console.error(error);
          else console.log("success!");
        }
      );
    },

    memberAvatar(member) {
      if (member) {
        return member.getAvatarUrl(
          this.$matrix.matrixClient.getHomeserverUrl(),
          40,
          40,
          "scale",
          true
        );
      }
      return null;
    },

    viewProfile() {
      this.$navigation.push({ name: "Profile" }, 1);
    },

    leaveRoom() {
      console.log("Leave");
    },

    upgradeAccount() {
      this.$matrix
        .upgradeGuestAccount()
        .then((user) => {
          // Done, login with the "new" account to get a real token instead of our guest token.
          this.user = user;
          return this.$store.dispatch("auth/login", this.user);
        })
        .then(() => {
          console.log("Upgrade done!");
        })
        .catch((err) => {
          console.log("ERROR", err);
        });
    },

    copyRoomLink() {
      this.$copyText(this.roomLink).then(function (e) {
          console.log(e)
        }, function (e) {
          console.log(e)
        });    
      }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>