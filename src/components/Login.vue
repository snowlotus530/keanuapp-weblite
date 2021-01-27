<template>
  <div class="login-root">
    <v-btn v-if="showBackArrow" icon @click.stop="$navigation.pop">
      <v-icon>arrow_back</v-icon>
    </v-btn>

    <div color="rgba(255,255,255,0.1)" class="text-center">
      <div class="h2">Login</div>
      <v-form v-model="isValid">
        <v-text-field
          v-model="user.username"
          label="Username"
          color="black"
          background-color="white"
          outlined
          :rules="[(v) => !!v || 'Username is required']"
          :error="userErrorMessage != null"
          :error-messages="userErrorMessage"
          required
          v-on:keyup.enter="$refs.password.focus()"
        ></v-text-field>
        <v-text-field
          ref="password"
          v-model="user.password"
          label="Password"
          color="black"
          background-color="white"
          outlined
          type="password"
          :rules="[(v) => !!v || 'Password is required']"
          :error="passErrorMessage != null"
          :error-messages="passErrorMessage"
          required
          v-on:keyup.enter="() => { if (isValid && !loading) { handleLogin() }}"
        ></v-text-field>
          <v-btn
            :disabled="!isValid || loading"
            primary
            large
            block
            @click.stop="handleLogin"
            :loading="loading"
            >Login</v-btn
          >
      </v-form>
    </div>
  </div>
</template>

<script>
import User from "../models/user";

export default {
  name: "Login",
  data() {
    return {
      user: new User("https://neo.keanu.im", "", ""),
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
    showBackArrow() {
      return this.$navigation && this.$navigation.canPop();
    }
  },
  created() {
    if (this.loggedIn) {
      this.$navigation.push({name: "Chat", params: { roomId: this.$matrix.currentRoomId }}, -1);
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
      if (
        this.message &&
        this.message.toLowerCase().includes("user")
      ) {
        this.userErrorMessage = this.message;
      } else {
        this.userErrorMessage = null;
      }
      if (
        this.message &&
        this.message.toLowerCase().includes("pass")
      ) {
        this.passErrorMessage = this.message;
      } else {
        this.passErrorMessage = null;
      }
    },
  },
  methods: {
    handleLogin() {
      if (this.user.username && this.user.password) {

      // Reset errors
      this.message = null;

        // Is it a full matrix user id? Modify a copy, so that the UI will still show the full ID.
        var user = Object.assign({}, this.user);
        user.normalize();

        this.loading = true;
        this.$store.dispatch("auth/login", user).then(
          () => {
            this.$navigation.push({name: "Chat", params: { roomId: this.$matrix.currentRoomId }}, -1);
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