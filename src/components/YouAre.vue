<template>
  <div class="d-flex flex-row-reverse">
    <v-chip
      @click="viewProfile"
      class="ma-2"
      :color="dark ? 'black' : '#ededed'"
      :text-color="dark ? 'white' : 'black'"
      :outlined="!dark"
      style="white-space: pre"
      >{{ $t("profile_info_popup.you_are") }}&nbsp;
      <span v-if="$matrix.currentUser.is_guest">
        <i18n path="profile_info_popup.identity_temporary" tag="span">
          <template v-slot:displayName>
            <b>{{ displayName }}</b>
          </template>
        </i18n>
      </span>
      <span v-else>
        <i18n path="profile_info_popup.identity" tag="span">
          <template v-slot:displayName>
            <b>{{ displayName }}</b>
          </template>
        </i18n>
      </span>
      <v-avatar color="#e0e0e0" right @click.stop="showProfileInfo = true">
        <img v-if="userAvatar" :src="userAvatar" />
        <span v-else class="white--text">{{ userAvatarLetter }}</span>
      </v-avatar>
    </v-chip>
  </div>
</template>
<script>
import profileInfoMixin from "./profileInfoMixin";

export default {
  name: "YouAre",
  mixins: [profileInfoMixin],
  props: {
    dark: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
  },
  data() {
    return {};
  },
  methods: {
    viewProfile() {
      this.$navigation.push({ name: "Profile" }, 1);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 