<template>
  <!-- ROOM JOIN RULES CHANGED -->
  <div class="statusEvent">
    {{ stateEventDisplayName(event) }} made the room {{ joinRule(event) }}
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
          return "invite only";
        case "public":
          return "public";
      }
      return joinRule;
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>