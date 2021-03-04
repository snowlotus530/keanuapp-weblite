<template>
  <!-- Contact joined the chat -->
  <div class="messageJoin">
    <div v-if="displayNameChange">
    {{ changer }} changed display name to {{ event.getContent().displayname }}
    </div>
    <div v-if="avatarChange">
    {{ changer }} changed the avatar
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
        return "You";
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