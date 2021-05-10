<template>
  <div v-if="user" class="profile">
    <div class="chat-header">
      <v-container fluid>
        <div class="room-name">My Profile</div>
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
                <v-avatar class="avatar" size="48" color="#e0e0e0">
          <img v-if="userAvatar" :src="userAvatar" />
            <span v-else class="white--text headline">{{
              userAvatarLetter
            }}</span>
          </v-avatar>
          </v-col>
          <v-col class="flex-shrink-1 flex-grow-1">
            <div class="h1">{{ displayName }}</div>
            <div class="text-center">{{ $matrix.currentUser.user_id }}</div>
            <div v-if="$matrix.currentUser.is_guest">
              This identity is temporary. Set a password to use it again.
            </div>
            <v-btn depressed block class="outlined-button" @click.stop="logout">Logout</v-btn>
          </v-col>
        </v-row>
      </v-container>

    <div class="action" @click="showEditPasswordDialog = true"><v-icon>lock</v-icon><span>Set password</span></div>
    <div class="action" @click="editValue = displayName;showEditDisplaynameDialog = true"><v-icon>edit</v-icon><span>Change name</span></div>

    <!-- edit password dialog -->
    <v-dialog v-model="showEditPasswordDialog" class="ma-0 pa-0" width="50%">
      <v-card :disabled="settingPassword">
        <v-card-title>Change password</v-card-title>
        <v-card-text>
          <v-text-field v-if="!$matrix.currentUser.is_guest" v-model="password" label="Old password" type="password" />
          <v-text-field v-model="newPassword1" label="New password" type="password" />
          <v-text-field v-model="newPassword2" label="Repeat new password" type="password" />
          <div class="red--text" v-if="passwordErrorMessage">{{ passwordErrorMessage }}</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeEditPasswordDialog">Cancel</v-btn>
          <v-btn
            :disabled="!passwordsMatch"
            color="primary"
            text
            @click="
              setPassword($matrix.currentUser.is_guest ? $matrix.currentUser.password : password, newPassword1);
            "
            >Ok</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- edit display name dialog -->
    <v-dialog v-model="showEditDisplaynameDialog" class="ma-0 pa-0" width="50%">
      <v-card>
        <v-card-title>Display name</v-card-title>
        <v-card-text>
          <v-text-field v-model="editValue" />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showEditDisplaynameDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="
              setDisplayName(editValue);
              showEditDisplaynameDialog = false;
            "
            >Ok</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "Profile",
  data() {
    return {
      showEditPasswordDialog: false,
      showEditDisplaynameDialog: false,
      editValue: null,
      password: null,
      newPassword1: null,
      newPassword2: null,
      settingPassword: false,
      passwordErrorMessage: null
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
      return (this.user.displayName || this.user.userId);
    },

    userAvatar() {
      if (!this.user || !this.user.avatarUrl) {
        return null;
      }
      return this.$matrix.matrixClient.mxcUrlToHttp(this.user.avatarUrl, 80, 80, 'scale', true);
    },

    userAvatarLetter() {
      if (!this.user) {
        return null;
      }
      return (this.user.displayName || this.user.userId.substring(1)).substring(0, 1).toUpperCase();
    },

    passwordsMatch() {
      return this.newPassword1 && this.newPassword2 && this.newPassword1 == this.newPassword2;
    }
  },

  methods: {
    logout() {
      //TODO - For guest accounts, show warning about not being able to rejoin.
      this.$store.dispatch("logout");
      this.$nextTick(() => {
        this.$navigation.push({path: "/login"}, -1);
      })
    },

    setDisplayName(name) {
      this.$matrix.matrixClient.setDisplayName(name);
    },

    setPassword(oldPassword, newPassword) {
      this.settingPassword = true;
      this.passwordErrorMessage = null;
      this.$matrix.setPassword(oldPassword, newPassword)
      .then(success => {
        console.log(success ? "Password changed" : "Failed to change password");
        this.closeEditPasswordDialog();
      })
      .catch(error => {
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
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>