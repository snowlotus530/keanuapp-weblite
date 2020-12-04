<template>
  <div class="d-flex justify-center login-root">
    <div color="rgba(255,255,255,0.1)">
      <h4>Login</h4>
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
  },
  created() {
    if (this.loggedIn) {
      this.$router.replace({name: "Chat"});
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
        this.message.message &&
        this.message.message.toLowerCase().includes("user")
      ) {
        this.userErrorMessage = this.message.message;
      } else {
        this.userErrorMessage = null;
      }
      if (
        this.message &&
        this.message.message &&
        this.message.message.toLowerCase().includes("pass")
      ) {
        this.passErrorMessage = this.message.message;
      } else {
        this.passErrorMessage = null;
      }
    },
  },
  methods: {
    handleLogin() {
      if (this.user.username && this.user.password) {
        this.loading = true;
        const self = this;
        this.$store.dispatch("auth/login", this.user).then(
          () => {
            self.$router.replace({ name: "Chat" });
          },
          (error) => {
            this.loading = false;
            this.message =
              (error.response && error.response.data) ||
              error.message ||
              error.toString();
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