<template>
  <div class="pa-4">
    <div class="chat-header">
      <v-container fluid>
        <v-row no-gutters>
          <v-col>
            <v-img
              src="@/assets/logo.svg"
              width="32"
              height="32"
              xclass="d-inline-block header-button-left"
            />
          </v-col>
          <v-col>
            <div class="room-name no-upper">{{ $t("login.title") }}</div>
          </v-col>
          <v-col class="text-right">
            <v-btn text v-if="showCloseButton" @click.stop="$navigation.pop">
              <v-icon>close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div color="rgba(255,255,255,0.1)" class="text-center">
      <v-form v-model="isValid">
        <v-text-field
          prepend-inner-icon="$vuetify.icons.user"
          v-model="user.user_id"
          :label="$t('login.username')"
          color="black"
          background-color="white"
          solo
          :rules="[(v) => !!v || $t('login.username_required')]"
          :error="userErrorMessage != null"
          :error-messages="userErrorMessage"
          required
          v-on:keyup.enter="$refs.password.focus()"
        ></v-text-field>
        <v-text-field
          prepend-inner-icon="$vuetify.icons.password"
          ref="password"
          v-model="user.password"
          :label="$t('login.password')"
          color="black"
          background-color="#f5f5f5"
          filled
          type="password"
          :rules="[(v) => !!v || $t('login.password_required')]"
          :error="passErrorMessage != null"
          :error-messages="passErrorMessage"
          required
          v-on:keyup.enter="
            () => {
              if (isValid && !loading) {
                handleLogin();
              }
            }
          "
        ></v-text-field>
        <v-checkbox class="mt-0" v-model="sharedComputer" :label="$t('join.shared_computer')" />
        <v-btn
          :disabled="!isValid || loading"
          color="black"
          depressed
          block
          @click.stop="handleLogin"
          :loading="loading"
          class="filled-button mt-8"
          >{{ $t("login.login") }}</v-btn
        >
      </v-form>
    </div>
  </div>
</template>

<script>
import User from "../models/user";
import util from "../plugins/utils";
import config from "../assets/config";

export default {
  name: "Login",
  data() {
    return {
      user: new User(config.defaultServer, "", ""),
      isValid: true,
      loading: false,
      message: "",
      userErrorMessage: null,
      passErrorMessage: null,
    };
  },
  computed: {
    loggedIn() {
      return this.$store.state.auth.status.loggedIn;
    },
    currentUser() {
      return this.$store.state.auth.user;
    },
    showCloseButton() {
      return this.$navigation && this.$navigation.canPop();
    },
    sharedComputer: {
      get: function () {
        return !this.$store.state.useLocalStorage;
      },
      set: function (sharedComputer) {
        this.$store.commit("setUseLocalStorage", !sharedComputer);
      },
    },
  },
  created() {
    if (this.loggedIn) {
      this.$navigation.push(
        {
          name: "Chat",
          params: { roomId: util.sanitizeRoomId(this.$matrix.currentRoomId) },
        },
        -1
      );
    }
  },
  watch: {
    user: {
      handler() {
        // Reset manual errors
        this.userErrorMessage = null;
        this.passErrorMessage = null;
      },
      deep: true,
    },
    message() {
      if (this.message && this.message.toLowerCase().includes("user")) {
        this.userErrorMessage = this.message;
      } else {
        this.userErrorMessage = null;
      }
      if (this.message && this.message.toLowerCase().includes("pass")) {
        this.passErrorMessage = this.message;
      } else {
        this.passErrorMessage = null;
      }
    },
  },
  methods: {
    handleLogin() {
      if (this.user.user_id && this.user.password) {
        // Reset errors
        this.message = null;

        // Is it a full matrix user id? Modify a copy, so that the UI will still show the full ID.
        var user = Object.assign({}, this.user);
        user.normalize();

        this.loading = true;
        this.$store.dispatch("login", user).then(
          () => {
            if (this.$matrix.currentRoomId) {
              this.$navigation.push(
                {
                  name: "Chat",
                  params: {
                    roomId: util.sanitizeRoomId(this.$matrix.currentRoomId),
                  },
                },
                -1
              );
            } else {
              this.$navigation.push({ name: "Home" }, -1);
            }
          },
          (error) => {
            this.loading = false;
            this.message =
              (error.data && error.data.error) ||
              error.message ||
              error.toString();
            console.log("Message set to ", this.message);
          }
        );
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/login.scss";
</style>