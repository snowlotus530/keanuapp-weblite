<template>
  <div v-if="room" class="room-info">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name">Info</div>
        <v-btn
          text
          class="header-button-left"
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
        <div class="h3">{{ roomTopic }}</div>
        <div class="small">Created by {{ creator }}</div>
        <canvas class="qr" id="room-qr"></canvas>
      </div>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">Permissions</v-card-title>
      <v-card-text>
        <v-radio-group
          v-model="roomJoinRule"
          v-if="roomJoinRule"
          :disabled="!userCanChangeJoinRule || updatingJoinRule"
        >
          <v-radio
            label="Room can be joined by invitation only"
            :value="'invite'"
          />
          <v-radio label="Anyone with the link can join" :value="'public'">
          </v-radio>
          <v-text-field
            v-if="publicRoomLink"
            :value="publicRoomLink"
            readonly
            append-icon="content_copy"
            filled
            type="text"
            @click:append="copyRoomLink"
          ></v-text-field>
        </v-radio-group>

        <!-- <div v-if="anyoneCanJoin">
          <div>Anyone with a link can join.</div>
          <v-text-field
            :value="publicRoomLink"
            readonly
            append-icon="content_copy"
            filled
            type="text"
            @click:append="copyRoomLink"
          ></v-text-field>
        </div> -->
      </v-card-text>
    </v-card>

    <v-card class="members ma-3" flat>
      <v-card-title class="h2"
        >Members<v-spacer></v-spacer>
        <div>{{ memberCount }}</div></v-card-title
      >
      <v-card-text>
        <div
          class="member ma-2"
          v-for="(member, index) in joinedMembers"
          :key="member.userId"
          v-show="showAllMembers || index < 5"
          @click="toggleMemberExpanded(member)"
        >
          <v-avatar class="avatar" size="32" color="grey">
            <img v-if="memberAvatar(member)" :src="memberAvatar(member)" />
            <span v-else class="white--text headline">{{
              member.name.substring(0, 1).toUpperCase()
            }}</span>
          </v-avatar>
          {{ member.user ? member.user.displayName : member.name
          }}{{ member.userId == $matrix.currentUserId ? " (you)" : "" }}
          <DeviceList
            v-if="expandedMembers.includes(member)"
            :member="member"
          />
        </div>
        <div class="show-all" @click="showAllMembers = !showAllMembers">
          {{ showAllMembers ? "Hide" : "Show all" }}
        </div>
      </v-card-text>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">My Profile</v-card-title>
      <v-card-text>
        <div>
          <div v-if="$matrix.currentUser.is_guest">
            Your identity <b>{{ displayName }}</b> is temporary. You can change
            your name or set a password to keep it.
          </div>
          <div v-else>
            Your are logged in as <b>{{ displayName }}</b
            >.
          </div>
          <v-btn depressed block class="outlined-button" @click.stop="viewProfile"
            >View</v-btn
          >
        </div>
      </v-card-text>
    </v-card>

    <v-card class="account ma-3" flat>
      <v-card-text>
        <v-btn
          color="red"
          depressed
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

    <div class="build-version">
      Powered by Guardian Project. Version: {{ buildVersion }}
    </div>

    <LeaveRoomDialog
      :show="showLeaveConfirmation"
      :room="room"
      @close="showLeaveConfirmation = false"
    />
  </div>
</template>

<script>
import LeaveRoomDialog from "../components/LeaveRoomDialog";
import DeviceList from "../components/DeviceList";
import QRCode from "qrcode";
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "RoomInfo",
  mixins: [roomInfoMixin],
  components: {
    LeaveRoomDialog,
    DeviceList,
  },
  data() {
    return {
      memberCount: null,
      user: null,
      displayName: "",
      showAllMembers: false,
      showLeaveConfirmation: false,
      expandedMembers: [],
      buildVersion: "",
      updatingJoinRule: false, // Flag if we are processing update curerntly
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
    creator() {
      if (this.room) {
        const createEvent = this.room.currentState.getStateEvents(
          "m.room.create",
          ""
        );
        if (!createEvent) {
          console.warn(
            "Room " + this.roomId + " does not have an m.room.create event"
          );
          return "";
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
      handler(ignoredNewVal, ignoredOldVal) {
        console.log("RoomInfo: Current room changed");
        this.updateMemberCount();
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
      if (this.room) {
        this.memberCount = this.room.getJoinedMemberCount();
      } else {
        this.memberCount = null;
      }
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

    copyRoomLink() {
      this.$copyText(this.roomLink).then(
        function (e) {
          console.log(e);
        },
        function (e) {
          console.log(e);
        }
      );
    },

    toggleMemberExpanded(member) {
      const index = this.expandedMembers.indexOf(member);
      if (index > -1) {
        this.expandedMembers.splice(index, 1);
      } else {
        this.expandedMembers.push(member);
      }
    },

    /**
     * Set room join rule.
     * @param joinRule One of "invite" or "public". Currently always disables guest access.
     */
    setRoomJoinRule(joinRule) {
      const cli = this.$matrix.matrixClient;
      if (!this.room || !cli) {
        return;
      }

      if (joinRule == this.getRoomJoinRule()) {
        return; // No change
      }

      this.updatingJoinRule = true;
      var aliasPromise = Promise.resolve();
      // if (!this.room.getCanonicalAlias()) {
      //   const alias = "#" + this.room.roomId.substring(1);
      //   aliasPromise = cli.createAlias(alias, this.room.roomId);
      // }
      aliasPromise
        .then(() => {
          cli.sendStateEvent(
            this.room.roomId,
            "m.room.join_rules",
            { join_rule: joinRule },
            ""
          );
        })
        .then(() => {
          cli.sendStateEvent(
            this.room.roomId,
            "m.room.guest_access",
            { guest_access: "forbidden" },
            ""
          );
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.updatingJoinRule = false;
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>