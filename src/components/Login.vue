<template>
  <div class="d-flex justify-center">
    <v-card class="ma-8 pa-4" style="min-width: 400px; max-width: 400px" flat>
      <v-card-title primary-title>
        <h4>Login</h4>
      </v-card-title>
      <v-form v-model="isValid">
        <v-text-field
          prepend-icon="mdi-account"
          v-model="user.username"
          label="Username"
          :rules="[(v) => !!v || 'Username is required']"
          :error="userErrorMessage != null"
          :error-messages="userErrorMessage"
          required
        ></v-text-field>
        <v-text-field
          prepend-icon="mdi-lock"
          v-model="user.password"
          label="Password"
          type="password"
          :rules="[(v) => !!v || 'Password is required']"
          :error="passErrorMessage != null"
          :error-messages="passErrorMessage"
          required
        ></v-text-field>
        <v-card-actions>
          <v-btn
            :disabled="!isValid || loading"
            primary
            large
            block
            @click.stop="handleLogin"
            :loading="loading"
            >Login</v-btn
          >
        </v-card-actions>
      </v-form>
    </v-card>
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
      this.$router.push("/profile");
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