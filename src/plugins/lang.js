import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

var messages = {}

function importAll(r) {
  return r.keys().map(res => {
      // Remove"./"
      const parts = res.split("/");
      const locale = parts[1].split(".")[0];
      messages[locale] = r(res);
  });
}
importAll(require.context('@/assets/translations/', true, /\.json$/));


export default new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  messages: messages
})