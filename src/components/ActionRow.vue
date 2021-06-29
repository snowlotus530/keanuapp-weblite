<template>
  <v-row
    class="action-row ma-0 pa-0"
    no-gutters
    align-content="center"
    v-on="$listeners"
  >
    <v-col cols="auto" class="me-2">
      <v-icon size="22">{{ icon }}</v-icon>
    </v-col>
    <v-col>{{ text }}</v-col>
  </v-row>
</template>

<script>
export default {
  name: "ActionRow",
  props: {
    icon: {
      type: String,
      default: function () {
        return null;
      },
    },
    text: {
      type: String,
      default: function () {
        return "";
      },
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 