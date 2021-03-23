<template>
  <div class="profile">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name">Create Group</div>
        <v-btn
          text
          class="back"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="$navigation.pop"
        >
          <v-icon>close</v-icon>
        </v-btn>
      </v-container>
    </div>

    <v-card class="members ma-3 pa-3" flat>
      <div class="text-center">
        <v-avatar
          size="120"
          color="#ededed"
          style="margin-bottom: 40px"
          @click.stop="showAvatarPicker"
        >
          <v-img v-if="roomAvatar" :src="roomAvatar" />
          <span v-else style="font-size: 80px" class="white--text">{{
            roomAvatarLetter
          }}</span>
        </v-avatar>
        <v-text-field
          v-model="roomName"
          label="Name"
          color="black"
          background-color="white"
          outlined
          v-on:keyup.enter="$refs.topic.focus()"
          :disabled="loading"
        ></v-text-field>
        <v-text-field
          ref="topic"
          v-model="roomTopic"
          label="Topic (optional)"
          color="black"
          background-color="white"
          outlined
          v-on:keyup.enter="$refs.create.$el.focus()"
          :disabled="loading"
        ></v-text-field>
        <v-btn
          ref="create"
          class="btn-dark"
          large
          block
          @click.stop="create"
          :loading="loading"
          :disabled="loading"
          >Create</v-btn
        >
        <div v-if="status">{{ status }}</div>
        <input
          ref="avatar"
          type="file"
          name="avatar"
          @change="handlePickedAvatar($event)"
          accept="image/*"
          style="display: none"
        />
      </div>
    </v-card>
  </div>
</template>

<script>
import util from "../plugins/utils";

export default {
  name: "CreateRoom",
  data() {
    return {
      roomName: "",
      roomTopic: "",
      roomAvatar: null,
      roomAvatarFile: null,
      loading: false,
      status: "",
    };
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
    create() {
      this.loading = true;
      var roomId;
      this.status = "Creating room";
      this.$matrix.matrixClient
        .createRoom({
          visibility: "private", // Not listed!
          room_alias_name: this.roomName.replace(/\s/g,'').toLowerCase(),
          name: this.roomName,
          topic: this.roomTopic,
          preset: "public_chat",
          initial_state: [{
            type: 'm.room.encryption',
            state_key: '',
            content: {
                algorithm: 'm.megolm.v1.aes-sha2',
            }
          }],
        })
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
          this.$navigation.push(
            { name: "Chat", params: { roomId: util.sanitizeRoomId(roomId) } },
            -1
          );
        })
        .catch((error) => {
          this.status =
            (error.data && error.data.error) ||
            error.message ||
            error.toString();
        })
        .finally(() => {
          this.loading = false;
        });
    },

    /**
     * Show picker to select room avatar file
     */
    showAvatarPicker() {
      this.$refs.avatar.click();
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
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>