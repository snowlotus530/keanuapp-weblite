<template>
  <div>
    <transition name="slow-fade">
      <div
        v-if="mounted"
        style="
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 100;
          background-color: black;
          align-items: center;
          justify-content: center;
          padding: 40px;
        "
        class="text-center d-flex flex-column"
      >
        <div v-if="roomWasPurged" style="width: 28px">
          <v-img src="@/assets/icons/trash.svg" />
        </div>
        <h2 v-if="roomWasPurged" class="white--text mt-2 mb-8">
          {{ $t("goodbye.room_deleted") }}
        </h2>
        <div class="quote white--text">{{ quote }}</div>
        <div class="author white--text mt-4">- {{ author }}</div>

        <v-btn
          v-if="joinedToAnyRoom"
          color="white"
          text
          class="close"
          @click.stop="viewOtherRooms"
          >{{ $t("goodbye.view_other_rooms") }}</v-btn
        >
        <v-btn
          v-else
          color="white"
          text
          class="close"
          @click.stop="closeBrowserTab"
          >{{ $t("goodbye.close_tab") }}</v-btn
        >
      </div>
    </transition>

    <!-- PROFILE INFO IN TOP RIGHT -->
    <transition name="slow-fade">
      <div
        v-if="mounted"
        style="
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 101;
          padding: 10px 20px;
          height: 50px;
          border-radius: 25px;
          background-color: #242424;
        "
      >
        <div class="d-inline-block me-2 white--text">
          {{ $t("profile_info_popup.you_are") }}
        </div>

        <div
          v-if="$matrix.currentUser.is_guest"
          class="d-inline-block me-2 white--text"
        >
          <i18n path="profile_info_popup.identity_temporary" tag="span">
            <template v-slot:displayName>
              <b>{{ displayName }}</b>
            </template>
          </i18n>
        </div>
        <div v-else class="d-inline-block me-2 white--text">
          <i18n path="profile_info_popup.identity" tag="span">
            <template v-slot:displayName>
              <b>{{ displayName }}</b>
            </template>
          </i18n>
        </div>
        <v-avatar
          class="avatar-32 d-inline-block"
          size="32"
          color="#e0e0e0"
          @click.stop="showProfileInfo = true"
        >
          <img v-if="userAvatar" :src="userAvatar" />
          <span v-else class="white--text">{{ userAvatarLetter }}</span>
        </v-avatar>
      </div>
    </transition>
  </div>
</template>
<script>
import profileInfoMixin from "./profileInfoMixin";

export default {
  name: "QuoteView",
  mixins: [profileInfoMixin],
  props: {
    roomWasPurged: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
  },
  data() {
    return {
      mounted: false,
      quote: "",
      author: "",
    };
  },
  mounted() {
    var quotes;
    try {
      quotes = require("@/assets/quotes/" + this.$i18n.locale + "/quotes");
    } catch (error) {
      console.error("No quotes for language");
      quotes = undefined;
    }
    if (!quotes) {
      quotes = require("@/assets/quotes/en/quotes"); // Default fallback
    }
    const n = quotes.quotes.length;
    const quote = quotes.quotes[Math.floor(Math.random() * n)];
    this.quote = quote.quote;
    this.author = quote.author;
    this.mounted = true;
  },

  computed: {
    /**
     * Return true if we are still joined to any rooms
     */
    joinedToAnyRoom() {
      const joinedRooms = this.$matrix.joinedRooms;
      return joinedRooms.length > 0;
    },
  },

  methods: {
    closeBrowserTab() {
      window.location.href = "about:blank";
    },
    viewOtherRooms() {
      this.$navigation.push({ name: "Home" }, -1);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";

.author {
  font-size: 80%;
}

.close {
  position: absolute;
  bottom: 40px;
}

.slow-fade-enter-active,
.slow-fade-leave-active {
  transition: opacity 2.5s;
}
.slow-fade-enter, .slow-fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style> 