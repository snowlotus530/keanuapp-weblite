<template>
  <!-- Contact joined the chat -->
  <div class="messageJoin">
    <div v-if="displayNameChange">
      {{ $t('message.user_changed_display_name', { user: changer, displayName: event.getContent().displayname})}}
    </div>
    <div v-if="avatarChange">
      {{ $t('message.user_changed_avatar', { user: changer})}}
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  computed: {
    displayNameChange() {
      const content = this.event.getContent();
      const prevContent = this.event.getPrevContent();
      return content.displayname != prevContent.displayname;
    },
    avatarChange() {
      const content = this.event.getContent();
      const prevContent = this.event.getPrevContent();
      return content.avatar_url != prevContent.avatar_url;
    },
    changer() {
      if (this.event.getSender() == this.$matrix.currentUserId) {
        return this.$t("message.you");
      }
      if (this.displayNameChange) {
        return this.event.getPrevContent().displayname;
      }
      return this.stateEventDisplayName(this.event);
    },
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>