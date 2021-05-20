<template>
  <div class="d-flex flex-column pa-4" style="overflow: hidden">
    <div class="flex-grow-0 flex-shrink-0">
      <div class="room-name">{{$t('invite.title')}}</div>
      <v-btn
        :loading="loading"
        text
        class="header-button-right"
        @click.stop="done"
      >
        <span>{{$t('invite.done')}}</span>
      </v-btn>
    </div>

    <div
      class="flex-grow-0 flex-shrink-0"
      style="min-height: 100px; max-height: 30vh"
    >
      <div class="h4">{{$t('invite.send_invites_to')}}</div>
      <div>{{ status }}</div>
      <v-chip-group active-class="primary--text" column>
        <v-chip
          v-for="member in selectedMembers"
          :key="member.userId"
          close
          @click:close="unselectMember(member)"
        >
          {{ memberName(member) }}
        </v-chip>
      </v-chip-group>
    </div>

    <div class="flex-grow-1 flex-shrink-1">
      <v-list class="member ma-2" style="overflow-y: auto">
        <v-list-item-group multiple v-model="selectedMembers">
          <v-list-item
            v-for="member in $matrix.getAllFriends()"
            :key="member.userId"
            :value="member"
          >
            <template v-slot:default="{ active }">
              <v-list-item-avatar color="grey">
                <img v-if="memberAvatar(member)" :src="memberAvatar(member)" />
                <span v-else class="white--text headline">{{
                  member.name.substring(0, 1).toUpperCase()
                }}</span>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ memberName(member) }}</v-list-item-title>
                <v-list-item-subtitle
                  v-text="member.userId"
                ></v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon v-if="active">
                  <v-icon color="grey lighten-1">check</v-icon>
                </v-btn>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </div>
  </div>
</template>

<script>
import util from "../plugins/utils";

export default {
  name: "Invite",
  data() {
    return {
      status: "",
      loading: false,
      selectedMembers: [],
    };
  },
  methods: {
    done() {
      if (this.selectedMembers.length > 0) {
        this.loading = true;
        this.sendInvite(0, this.selectedMembers.slice()); // Copy array! We remove stuff from original!
      } else {
        this.close();
      }
    },

    close() {
      this.$navigation.push(
        {
          name: "Chat",
          params: { roomId: util.sanitizeRoomId(this.$matrix.currentRoomId) },
        },
        -1
      );
    },

    sendInvite(index, memberArray) {
      if (index == memberArray.length) {
        // Done.
        this.loading = false;
        if (this.selectedMembers.length > 0) {
          // Error.
          this.status = this.$t('invite.status_error');
        } else {
          this.status = "";
          this.close();
        }
        return;
      }
      this.status = this.$t('invite.status_error', {index: index + 1, count: memberArray.length});
      const member = memberArray[index];

      // Is this userId already a member of this room? In that case don't send an invite.
      if (this.$matrix.currentRoom) {
        const existingMember = this.$matrix.currentRoom.getMember(
          member.userId
        );
        if (existingMember && existingMember.membership === "join") {
          this.unselectMember(member);
          this.sendInvite(index + 1, memberArray);
          return;
        }
      }

      this.$matrix.matrixClient
        .invite(this.$matrix.currentRoomId, member.userId)
        .then(() => {
          // Successfully sent! Remove from array so that after all are sent,
          // the "selectedMembers" array will only contain those that failed.
          this.unselectMember(member);
        })
        .catch((err) => {
          console.log("Failed to invite:", err);
        })
        .finally(() => {
          this.sendInvite(index + 1, memberArray);
        });
    },

    unselectMember(member) {
      const idx = this.selectedMembers.indexOf(member);
      if (idx >= 0) {
        this.selectedMembers.splice(idx, 1);
      }
    },

    memberName(member) {
      return member.user ? member.user.displayName : member.name;
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
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>