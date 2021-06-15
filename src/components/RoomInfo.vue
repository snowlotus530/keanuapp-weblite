<template>
  <div v-if="room" class="room-info">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name no-upper">{{ $t("room_info.title") }}</div>
        <v-btn
          text
          class="header-button-left"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="$navigation.pop"
        >
          <v-icon>arrow_back</v-icon>
          <span>{{ $t("menu.back") }}</span>
        </v-btn>
        <v-btn
          color="black"
          depressed
          class="header-button-right filled-button mr-3"
          @click.stop="showLeaveConfirmation = true"
          >👋 {{ $t("room_info.leave_room") }}</v-btn
        >
      </v-container>
    </div>

    <div class="members ma-3 pa-3 mt-0 pt-0 text-center">
      <v-avatar class="room-avatar">
        <v-img v-if="roomAvatar" :src="roomAvatar" />
        <span v-else class="white--text headline">{{
          roomName.substring(0, 1).toUpperCase()
        }}</span>
      </v-avatar>
      <div class="name">{{ roomName }}</div>
      <div class="topic">{{ roomTopic }}</div>
      <div class="created-by">
        {{ $t("room_info.created_by", { user: creator }) }}
      </div>
    </div>

    <v-expand-transition>
      <v-container fluid class="pa-0" v-show="publicRoomLink">
        <v-row cols="12" class="qr-container ma-3">
          <v-col cols="auto">
            <canvas ref="roomQr" class="qr" id="room-qr"></canvas>
          </v-col>
          <v-col align-self="center">
            <div class="link">{{ publicRoomLink }}</div>
          </v-col>
        </v-row>
        <v-row align="center" class="mt-0 pt-0">
          <v-col align="center" class="mt-0 pt-0">
            <v-btn
              v-if="publicRoomLinkCopied"
              color="#DEE6FF"
              depressed
              class="filled-button link-copied-in-place"
              style="min-width: 180px"
              >{{ $t("room_info.link_copied") }}</v-btn
            >
            <v-btn
              v-else
              color="black"
              depressed
              class="filled-button"
              style="min-width: 180px"
              @click.stop="copyRoomLink"
              >{{ $t("room_info.copy_link") }}</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-expand-transition>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">{{ $t("room_info.permissions") }}</v-card-title>
      <v-card-text>
        <v-select
          color="grey"
          v-if="roomJoinRule"
          :disabled="!userCanChangeJoinRule || updatingJoinRule"
          :items="joinRules"
          class="mt-4"
          v-model="roomJoinRule"
          item-value="id"
        >
          <template v-slot:selection="{ item }">
            <v-icon color="black" class="mr-2">{{ item.icon }}</v-icon>
            {{ item.text }}
          </template>
          <template v-slot:item="{ item, attrs, on }">
            <v-list-item v-on="on" v-bind="attrs" #default="{ active }">
              <v-list-item-avatar>
                <v-icon color="black">{{ item.icon }}</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="item.text"></v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon v-if="active">
                  <v-icon color="grey lighten-1">check</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </template>
        </v-select>

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
        >{{ $t("room_info.members") }}<v-spacer></v-spacer>
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
          {{
            member.userId == $matrix.currentUserId
              ? $t("room_info.user_you", {
                  user: member.user ? member.user.displayName : member.name,
                })
              : $t("room_info.user", {
                  user: member.user ? member.user.displayName : member.name,
                })
          }}
          <DeviceList
            v-if="expandedMembers.includes(member)"
            :member="member"
          />
        </div>
        <div class="show-all" @click="showAllMembers = !showAllMembers">
          {{
            showAllMembers ? $t("room_info.hide_all") : $t("room_info.show_all")
          }}
        </div>
      </v-card-text>
    </v-card>

    <!-- PURGE ROOM -->
    <div class="members ma-3 pa-3 text-center">
      <v-btn
        v-if="userCanPurgeRoom"
        color="red"
        depressed
        class="filled-button"
        @click.stop="showPurgeConfirmation = true"
        >{{ $t("room_info.purge") }}</v-btn
      >
    </div>

    <v-card class="account ma-3" flat>
      <v-card-title class="h2">{{ $t("room_info.my_profile") }}</v-card-title>
      <v-card-text>
        <div>
          <div v-if="$matrix.currentUser.is_guest">
            <i18n path="room_info.identity_temporary" tag="span">
              <template v-slot:displayName>
                <b>{{ displayName }}</b>
              </template>
            </i18n>
          </div>
          <div v-else>
            <i18n path="room_info.identity" tag="span">
              <template v-slot:displayName>
                <b>{{ displayName }}</b>
              </template>
            </i18n>
          </div>
          <v-btn
            depressed
            block
            class="outlined-button"
            @click.stop="viewProfile"
            >{{ $t("room_info.view_profile") }}</v-btn
          >
        </div>
      </v-card-text>
    </v-card>

    <div class="build-version">
      {{ $t("room_info.version_info", { version: buildVersion }) }}
    </div>

    <LeaveRoomDialog
      :show="showLeaveConfirmation"
      :room="room"
      @close="showLeaveConfirmation = false"
    />

    <PurgeRoomDialog
      :show="showPurgeConfirmation"
      :room="room"
      @close="showPurgeConfirmation = false"
    />
  </div>
</template>

<script>
import LeaveRoomDialog from "../components/LeaveRoomDialog";
import PurgeRoomDialog from "../components/PurgeRoomDialog";
import DeviceList from "../components/DeviceList";
import QRCode from "qrcode";
import roomInfoMixin from "./roomInfoMixin";

export default {
  name: "RoomInfo",
  mixins: [roomInfoMixin],
  components: {
    LeaveRoomDialog,
    PurgeRoomDialog,
    DeviceList,
  },
  data() {
    return {
      memberCount: null,
      user: null,
      displayName: "",
      showAllMembers: false,
      showLeaveConfirmation: false,
      showPurgeConfirmation: false,
      expandedMembers: [],
      buildVersion: "",
      updatingJoinRule: false, // Flag if we are processing update curerntly
      publicRoomLinkCopied: false,
      joinRules: [
        {
          id: "public",
          text: this.$t("room_info.join_public"),
          icon: "link",
        },
        {
          id: "invite",
          text: this.$t("room_info.join_invite"),
          icon: "person_add",
        },
      ],
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
      var fullUrl = this.publicRoomLink;
      var canvas = this.$refs.roomQr;
      if (fullUrl && canvas) {
        QRCode.toCanvas(
          canvas,
          fullUrl,
          {
            type: "image/png",
            margin: 1,
            width: 60,
          },
          function (error) {
            if (error) console.error(error);
            else console.log("success!");
          }
        );
      }
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
          this.updateQRCode();
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>