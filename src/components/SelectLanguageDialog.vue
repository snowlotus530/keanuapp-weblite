<template>
  <v-dialog
    class="ma-0 pa-0"
    width="80%"
    v-bind="{ ...$props, ...$attrs }"
    v-on="$listeners"
  >
    <v-card class="dialog-card">
      <v-card-title class="dialog-title"
        ><h3>{{ $t("profile.select_language") }}</h3></v-card-title
      >
      <v-card-text>
        <v-select
          v-model="$i18n.locale"
          :items="languages"
          menu-props="auto"
          :label="$t('profile.select_language')"
          v-on:change="$store.commit('setLanguage', $i18n.locale)"
          hide-details
          prepend-icon="language"
          single-line
        ></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="black"
          depressed
          block
          class="filled-button"
          @click="$emit('close')"
          >{{ $t("menu.ok") }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      languages: [],
    };
  },
  mounted() {
    for (const locale of Object.keys(this.$i18n.messages)) {
      this.languages.push({
        text: this.$i18n.messages[locale].language_display_name || locale,
        value: locale,
      });
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>
