<template>
  <div class="messageJoin">
    <div>
      {{ allChanges }}
    </div>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  computed: {
    allChanges() {
      const content = this.event.getContent();
      const prevContent = this.event.getPrevContent();
      if (!prevContent || !prevContent.users || !content || !content.users) {
        return "";
      }
      const userDefault = this.event.getContent().users_default || 0;

      // Construct set of userIds
      const users = [];
      Object.keys(content.users).forEach((userId) => {
        if (users.indexOf(userId) === -1) users.push(userId);
      });
      Object.keys(prevContent.users).forEach((userId) => {
        if (users.indexOf(userId) === -1) users.push(userId);
      });

      const diff = [];
      users.forEach((userId) => {
        // Previous power level
        const from = prevContent.users[userId];
        // Current power level
        const to = content.users[userId];
        if (to !== from) {
          diff.push(
            this.$t("message.user_powerlevel_change_from_to", {
              user: userId,
              powerOld: this.powerLevelString(from, userDefault),
              powerNew: this.powerLevelString(to, userDefault),
            })
          );
        }
      });
      if (!diff.length) {
        return "";
      }
      return this.$t("message.room_powerlevel_change", {
        user: this.changer,
        changes: diff.join(", "),
      });
    },
    changer() {
      if (this.event.getSender() == this.$matrix.currentUserId) {
        return this.$t("message.you");
      }
      return this.event.sender
        ? this.event.sender.name
        : this.event.getSender();
    },
  },
  methods: {
    powerLevelString(level, defaultUserLevel) {
      const map = {
        undefined: this.$t("power_level.default"),
        0: this.$t("power_level.restricted"),
        [defaultUserLevel]: this.$t("power_level.default"),
        50: this.$t("power_level.moderator"),
        100: this.$t("power_level.admin"),
      };
      if (map[level]) {
        return map[level];
      } else {
        return this.$t("power_level.custom", { level: level });
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>