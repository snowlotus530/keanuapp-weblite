<template>
  <div class="statusEvent">
    {{
      openToGuests
        ? $t("message.user_changed_guest_access_open", {
            user: stateEventDisplayName(event),
          })
        : $t("message.user_changed_guest_access_closed", {
            user: stateEventDisplayName(event),
          })
    }}
  </div>
</template>

<script>
import messageMixin from "./messageMixin";

export default {
  mixins: [messageMixin],
  computed: {
    openToGuests() {
      const access = this.event.getContent().guest_access;
      if (access && access == "forbidden") {
        return false;
      }
      return true;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>