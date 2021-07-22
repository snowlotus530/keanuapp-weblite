<template>
  <div v-if="user" class="profile">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name no-upper">{{ $t("profile.title") }}</div>
        <v-btn
          text
          class="header-button-right"
          v-show="$navigation && $navigation.canPop()"
          @click.stop="$navigation.pop"
        >
          <v-icon>close</v-icon>
        </v-btn>
      </v-container>
    </div>

    <v-container class="user-info">
      <v-row>
        <v-col class="flex-grow-0 flex-shrink-0">
          <v-avatar
            class="avatar-48 clickable"
            size="48"
            color="#e0e0e0"
            @click="showAvatarPicker"
          >
            <img v-if="userAvatar" :src="userAvatar" />
            <span v-else class="white--text">{{ userAvatarLetter }}</span>
            <input
              ref="avatar"
              type="file"
              name="avatar"
              @change="handlePickedAvatar($event)"
              accept="image/*"
              style="display: none"
            />
          </v-avatar>
        </v-col>
        <v-col class="flex-shrink-1 flex-grow-1">
          <div class="h1">{{ displayName }}</div>
          <div class="text-center">{{ $matrix.currentUser.user_id }}</div>
          <!-- <div v-if="$matrix.currentUser.is_guest">
            {{ $t("profile.temporary_identity") }}
          </div> -->
          <v-btn depressed block class="outlined-button" @click.stop="logout">{{
            $t("menu.logout")
          }}</v-btn>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="mt-2 pa-5">
      <ActionRow
        @click="showEditPasswordDialog = true"
        :icon="'$vuetify.icons.password'"
        :text="$t('profile.set_password')"
      />
      <ActionRow
        @click="
          editValue = displayName;
          showEditDisplaynameDialog = true;
        "
        :icon="'$vuetify.icons.edit'"
        :text="$t('profile.change_name')"
      />
      <ActionRow
        @click="showSelectLanguageDialog = true"
        :icon="'$vuetify.icons.globe'"
        :text="$t('profile.select_language')"
      />
    </v-container>

    <!-- edit password dialog -->
    <v-dialog v-model="showEditPasswordDialog" class="ma-0 pa-0" width="50%">
      <v-card :disabled="settingPassword">
        <v-card-title>{{ $t("profile.change_password") }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-if="!$matrix.currentUser.is_guest"
            v-model="password"
            :label="$t('profile.password_old')"
            type="password"
          />
          <v-text-field
            v-model="newPassword1"
            :label="$t('profile.password_new')"
            type="password"
          />
          <v-text-field
            v-model="newPassword2"
            :label="$t('profile.password_repeat')"
            type="password"
          />
          <div class="red--text" v-if="passwordErrorMessage">
            {{ passwordErrorMessage }}
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeEditPasswordDialog">{{
            $t("menu.cancel")
          }}</v-btn>
          <v-btn
            :disabled="!passwordsMatch"
            color="primary"
            text
            @click="
              setPassword(
                $matrix.currentUser.is_guest
                  ? $matrix.currentUser.password
                  : password,
                newPassword1
              )
            "
            >{{ $t("menu.ok") }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- edit display name dialog -->
    <v-dialog v-model="showEditDisplaynameDialog" class="ma-0 pa-0" width="50%">
      <v-card>
        <v-card-title>{{ $t("profile.display_name") }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editValue" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showEditDisplaynameDialog = false">{{
            $t("menu.cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            text
            @click="
              setDisplayName(editValue);
              showEditDisplaynameDialog = false;
            "
            >{{ $t("menu.ok") }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SelectLanguageDialog
      v-model="showSelectLanguageDialog"
      v-on:close="showSelectLanguageDialog = false"
    />
  </div>
</template>

<script>
import SelectLanguageDialog from "./SelectLanguageDialog.vue";
import dataUriToBuffer from "data-uri-to-buffer";
import ActionRow from "./ActionRow.vue";
import ImageResize from "image-resize";
const sizeOf = require("image-size");
//const dataUriToBuffer = require("data-uri-to-buffer");
import util from "../plugins/utils";

export default {
  name: "Profile",
  components: {
    ActionRow,
    SelectLanguageDialog,
  },
  data() {
    return {
      showEditPasswordDialog: false,
      showEditDisplaynameDialog: false,
      showSelectLanguageDialog: false,
      editValue: null,
      password: null,
      newPassword1: null,
      newPassword2: null,
      settingPassword: false,
      passwordErrorMessage: null,
    };
  },

  computed: {
    user() {
      if (!this.$matrix.matrixClient) {
        return null;
      }
      return this.$matrix.matrixClient.getUser(this.$matrix.currentUserId);
    },

    displayName() {
      if (!this.user) {
        return null;
      }
      return this.user.displayName || this.user.userId;
    },

    userAvatar() {
      if (!this.user || !this.user.avatarUrl) {
        return null;
      }
      return this.$matrix.matrixClient.mxcUrlToHttp(
        this.user.avatarUrl,
        80,
        80,
        "scale",
        true
      );
    },

    userAvatarLetter() {
      if (!this.user) {
        return null;
      }
      return (this.user.displayName || this.user.userId.substring(1))
        .substring(0, 1)
        .toUpperCase();
    },

    passwordsMatch() {
      return (
        this.newPassword1 &&
        this.newPassword2 &&
        this.newPassword1 == this.newPassword2
      );
    },
  },

  methods: {
    setDisplayName(name) {
      this.$matrix.matrixClient.setDisplayName(name);
    },

    setPassword(oldPassword, newPassword) {
      this.settingPassword = true;
      this.passwordErrorMessage = null;
      this.$matrix
        .setPassword(oldPassword, newPassword)
        .then((success) => {
          console.log(
            success ? "Password changed" : "Failed to change password"
          );
          this.closeEditPasswordDialog();
        })
        .catch((error) => {
          this.passwordErrorMessage = error.message;
        })
        .finally(() => {
          this.settingPassword = false;
        });
    },

    closeEditPasswordDialog() {
      this.passwordErrorMessage = null;
      this.password = null;
      this.newPassword1 = null;
      this.newPassword2 = null;
      this.showEditPasswordDialog = false;
    },

    showAvatarPicker() {
      this.$refs.avatar.click();
    },

    handlePickedAvatar(event) {
      const self = this;
      if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
          const file = event.target.files[0];
          if (file.type.startsWith("image/")) {
            try {
              var image = e.target.result;

              var dimens = sizeOf(dataUriToBuffer(e.target.result));

              // Need to resize?
              const w = dimens.width;
              const h = dimens.height;
              if (w > 640 || h > 640) {
                var aspect = w / h;
                var newWidth = parseInt((w > h ? 640 : 640 * aspect).toFixed());
                var newHeight = parseInt(
                  (w > h ? 640 / aspect : 640).toFixed()
                );
                var imageResize = new ImageResize({
                  format: "png",
                  width: newWidth,
                  height: newHeight,
                  outputType: "blob",
                });
                imageResize
                  .play(event.target)
                  .then((img) => {
                    var resizedImageFile = new File([img], file.name, {
                      type: img.type,
                      lastModified: Date.now(),
                    });
                    var reader2 = new FileReader();
                    reader2.onload = (e) => {
                      self.setAvatar(e.target.result);
                    };
                    reader2.readAsDataURL(resizedImageFile);
                  })
                  .catch((err) => {
                    console.error("Resize failed:", err);
                  });
              } else {
                self.setAvatar(image);
              }
            } catch (error) {
              console.error("Failed to get image dimensions: " + error);
            }
          }
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    },

    setAvatar(image) {
      return util.setAvatar(this.$matrix, image, function (progress) {
        console.log("Progress: " + JSON.stringify(progress));
      });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>