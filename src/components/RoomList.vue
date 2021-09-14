<template>
  <v-list dense class="room-list">
    <div class="h4">{{ title }}</div>
    <v-list-item-group v-model="currentRoomId" color="primary">
      <v-list-item v-if="showCreate" @click.stop="$emit('newroom')">
        <v-list-item-content>
          <v-list-item-title class="new-room">{{
            $t("menu.new_room")
          }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- invites -->
      <v-list-item
        :disabled="roomsProcessing[room.roomId]"
        v-for="room in invitedRooms"
        :key="room.roomId"
        :value="room.roomId"
      >
        <v-list-item-avatar size="40" color="#e0e0e0">
          <v-img :src="room.avatar" />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ room.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ room.topic }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn
            class="filled-button"
            depressed
            color="black"
            @click.stop="acceptInvitation(room)"
            >{{ $t("menu.join") }}</v-btn
          >
          <v-btn
            class="filled-button"
            color="black"
            @click.stop="rejectInvitation(room)"
            text
            >{{ $t("menu.ignore") }}</v-btn
          >
        </v-list-item-action>
      </v-list-item>

      <v-list-item
        v-for="room in joinedRooms"
        :key="room.roomId"
        :value="room.roomId"
        style="position: relative"
      >
        <v-list-item-avatar size="40" color="#e0e0e0">
          <v-img :src="room.avatar" />
        </v-list-item-avatar>
        <div class="room-list-notification-count">
          {{ notificationCount(room) }}
        </div>
        <v-list-item-content>
          <v-list-item-title>{{ room.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ room.topic }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
import util from "../plugins/utils";
import Vue from "vue";

export default {
  name: "RoomList",

  props: {
    title: {
      type: String,
      default: "Rooms",
    },
    showInvites: {
      type: Boolean,
      default: false,
    },
    showCreate: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    currentRoomId: null,
    /** A list of rooms currently processing some operation, like "join" or "reject" */
    roomsProcessing: {},
  }),

  computed: {
    invitedRooms() {
      return this.sortItemsOnName(this.$matrix.invites);
    },
    joinedRooms() {
      return this.sortItemsOnName(this.$matrix.joinedRooms);
    },
  },

  methods: {
    sortItemsOnName(items) {
      if (items == null) {
        return [];
      }
      return items.sort(function (a, b) {
        const titleA = a.name || a.summary.info.title;
        const titleB = b.name || b.summary.info.title;
        if (titleA == null) {
          return 1;
        } else if (titleB == null) {
          return -1;
        }
        return titleA.localeCompare(titleB);
      });
    },

    notificationCount(room) {
      return room.getUnreadNotificationCount("total") || 0;
    },

    acceptInvitation(room) {
      Vue.set(this.roomsProcessing, room.roomId, true);
      this.$matrix.matrixClient
        .joinRoom(room.roomId)
        .then((ignoredRoom) => {
          this.$nextTick(() => {
            this.$navigation.push(
              {
                name: "Chat",
                params: {
                  roomId: util.sanitizeRoomId(
                    room.getCanonicalAlias() || room.roomId
                  ),
                },
              },
              -1
            );
          });
        })
        .catch((err) => {
          console.error("Failed to accept invite: ", err);
        })
        .finally(() => {
          Vue.delete(this.roomsProcessing, room.roomId);
        });
    },

    rejectInvitation(room) {
      Vue.set(this.roomsProcessing, room.roomId, true);
      this.$matrix
        .leaveRoom(room.roomId)
        .catch((err) => {
          console.error("Failed to reject invite: ", err);
        })
        .finally(() => {
          Vue.delete(this.roomsProcessing, room.roomId);
        });
    },
  },

  watch: {
    currentRoomId() {
      if (this.currentRoomId == null) {
        // Ignore, this is caused by "new room" etc.
        return;
      }
      this.$emit("close");
      this.$navigation.push(
        {
          name: "Chat",
          params: { roomId: util.sanitizeRoomId(this.currentRoomId) },
        },
        -1
      );
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>

<style lang="scss" scoped>
/** Align action buttons side to side */
.v-list-item__action--stack {
  flex-direction: row !important;
}
</style>