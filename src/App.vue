<template>
  <v-app>
    <v-main>
      <router-view />

      <!-- Loading indicator -->
      <v-container
        fluid
        fill-height
        style="
          position: absolute;
          z-index: 20;
          background-color: rgba(255, 255, 255, 1);
        "
        v-if="loading"
      >
        <v-row align="center" justify="center">
          <v-col class="text-center">
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
            <div>{{$t('menu.loading', {appName: appName})}}</div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import config from "./assets/config";

export default {
  name: "App",
  data() {
    return {
      loading: true,
    };
  },
  beforeMount() {
    // Set language
    this.$i18n.locale = this.$store.state.language || "en";
  },
  mounted() {
    if (
      window.location.protocol == "http" &&
      !window.location.hostname.endsWith(".onion")
    ) {
      // Redirect to HTTPS
      window.location.href = window.location.href.replace("http:", "https:");
      return;
    }
    if (this.currentUser) {
      this.$matrix
        .login(this.currentUser)
        .then(() => {
          console.log("Matrix client ready");
        })
        .catch((error) => {
          console.log("Error creating client", error);
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      this.loading = false;
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    appName() {
      return config.appName;
    },
    title() {
      var title = this.$t(config.appName);
      if (this.$matrix.notificationCount > 0) {
        title += " [" + this.$matrix.notificationCount + "]";
      }
      if (this.$route.meta.title) {
        title += "  - " + this.$route.meta.title;
      }
      if (this.$route.meta.includeRoom) {
        if (this.$matrix.currentRoom) {
          title +=
            " - " +
            (this.$matrix.currentRoom.summary.info.title ||
              this.$matrix.currentRoom.roomId);
        } else if (this.$matrix.currentRoomId) {
          title += " - " + this.$matrix.currentRoomId;
        }
      }
      return title;
    },
  },
  watch: {
    "$i18n.locale": {
      handler(val) {
        // Locale changed, check file if RTL
        var isRTL = this.$i18n.messages[val].language_is_rtl || false;
        if (isRTL) {
          this.$vuetify.rtl = true;
          document.documentElement.setAttribute("dir", "rtl");
        } else {
          this.$vuetify.rtl = false;
          document.documentElement.removeAttribute("dir");
        }
      },
      immediate: true,
    },
    title(title) {
      document.title = title;
    },
  },
};
</script>

<style lang="scss">
.copyright {
  font-size: 10px;
}
</style>