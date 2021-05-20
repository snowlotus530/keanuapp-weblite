<template>
  <!-- ROOM JOIN RULES CHANGED -->
  <div class="statusEvent">
    {{ $t('message.user_changed_join_rules', { user: stateEventDisplayName(event), type: joinRule(event)}) }}
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  methods: {
    joinRule(event) {
      const joinRule = event.getContent().join_rule;
      switch (joinRule) {
        case "invite":
          return this.$t('message.room_joinrule_invite');
        case "public":
          return this.$t('message.room_joinrule_public');
      }
      return joinRule;
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>