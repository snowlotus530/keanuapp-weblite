<template>
  <v-dialog
    v-model="showDialog"
    content-class="profile-info-popup"
    class="ma-0 pa-0"
    :width="$vuetify.breakpoint.smAndUp ? '60%' : '95%'"
  >
    <v-card flat>
      <v-card-text>
        <div class="you-are">{{ $t("profile_info_popup.you_are") }}</div>
        <v-container fluid>
          <v-row>
            <v-col class="username" cols="pa-2">
              <div v-if="$matrix.currentUser.is_guest">
                <i18n path="profile_info_popup.identity_temporary" tag="span">
                  <template v-slot:displayName>
                    <b>{{ displayName }}</b>
                  </template>
                </i18n>
              </div>
              <div v-else>
                <i18n path="profile_info_popup.identity" tag="span">
                  <template v-slot:displayName>
                    <b>{{ displayName }}</b>
                  </template>
                </i18n>
              </div>
            </v-col>
            <v-col cols="auto" class="pa-2">
              <v-avatar
                class="avatar-32"
                size="32"
                color="#e0e0e0"
                @click.stop="showProfileInfo = true"
              >
                <img v-if="userAvatar" :src="userAvatar" />
                <span v-else class="white--text">{{ userAvatarLetter }}</span>
              </v-avatar>
            </v-col>
          </v-row>
        </v-container>

        <v-container class="mt-4 pa-0">
          <ActionRow @click="viewProfile" :icon="'account_circle'" :text="$t('profile_info_popup.edit_profile')" />
          <ActionRow @click="logout" :icon="'logout'" :text="$t('profile_info_popup.logout')" />
        </v-container>

        <div class="more-container">
          <div class="want_more">🙌 {{$t('profile_info_popup.want_more')}}</div>
          <i18n path="profile_info_popup.powered_by" tag="div">
            <template v-slot:product>{{ product }}</template>
            <template v-slot:productLink>
              <a :href="productLink">{{ productLink }}</a>
            </template>
          </i18n>
          <div style="position:relative;width:100%;height: 40px">
            <v-btn class="new_room" right absolute text @click="createRoom">{{ $t('profile_info_popup.new_room') }}</v-btn></div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
import profileInfoMixin from "./profileInfoMixin";
import ActionRow from "./ActionRow.vue";
import config from "../assets/config";

export default {
  name: "ProfileInfoPopup",
  mixins: [profileInfoMixin],
  components: {
    ActionRow
  },
  props: {
    show: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
  },
  data() {
    return {
      showDialog: false,
    };
  },
  computed: {
    product() {
      return config.product;
    },
    productLink() {
      return config.productLink;
    }
  },
  watch: {
    show: {
      handler(newVal, ignoredOldVal) {
        this.showDialog = newVal;
      },
    },
    showDialog() {
      if (!this.showDialog) {
        this.$emit("close");
      }
    },
  },

  methods: {
    viewProfile() {
      this.showDialog = false;
      this.$navigation.push({ name: "Profile" }, 1);
    },
    createRoom() {
      this.showDialog = false;
      this.$navigation.push({ name: "CreateRoom" });
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
.profile-info-popup {
    font-family: "Inter", sans-serif !important;
    font-size: 16px;
    position: fixed;
    margin: 0px;
    top: 70px;
    right: 10px;
    border-radius: 40px;
    &::before {
        content: '▲';
        position: fixed;
        top: 57px;
        right: 22px;
        color: white;
    }
    .you-are {
        padding-top: 20px;
        font-size: 12px;
    }
    .username {
        border-radius: 4px;
        background-color: #f5f5f5;
    }
    .more-container {
        border-radius: 10px;
        background-color: #f5f5f5;
        padding: 20px;
        .want_more {
            font-family: "Poppins", sans-serif;
            font-weight: 700;
            font-size: 13 * $chat-text-size;        
        }
        .new_room .v-btn__content {
          font-family: "Poppins", sans-serif !important;
            font-weight: 700 !important;
            font-size: 13 * $chat-text-size !important;  
        }
    }
}
</style>