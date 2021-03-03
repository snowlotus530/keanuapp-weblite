<template>
  <!-- ROOM AVATAR CHANGED -->
  <div class="statusEvent">
    {{ stateEventDisplayName(event) }} made room history {{ history(event) }}
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  methods: {
    history(event) {
      const visibility = event.getContent().history_visibility;
      switch (visibility) {
        case "world_readable":
          return "readable by anyone";
        case "shared":
          return "readable to all members in the room";
        case "invited":
          return "readable to members from when they were invited";
        case "joined":
          return "readable to members from when they joined";
      }
      return visibility;
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>