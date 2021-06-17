export default {
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
  }
}