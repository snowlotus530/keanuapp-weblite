import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import store from './store'
import router from './router'
import matrix from './services/matrix.service'
import navigation from './services/navigation.service'
import cleaninsights from './services/cleaninsights.service'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import VEmojiPicker from 'v-emoji-picker';
import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';
import VueClipboard from 'vue-clipboard2'
import VueSanitize from "vue-sanitize";
import i18n from './plugins/lang';

var defaultOptions = VueSanitize.defaults;
defaultOptions.disallowedTagsMode = "recursiveEscape";
defaultOptions.allowedTags = [];
Vue.use(VueSanitize, defaultOptions);

Vue.config.productionTip = false

Vue.use(VueResize);
Vue.use(VEmojiPicker);
Vue.use(matrix, { store: store, i18n: i18n });
Vue.use(cleaninsights);
Vue.use(VueClipboard);

// Add bubble functionality to custom events.
// From here: https://stackoverflow.com/questions/41993508/vuejs-bubbling-custom-events
Vue.use((Vue) => {
  Vue.prototype.$bubble = function $bubble(eventName, ...args) {
    // Emit the event on all parent components
    let component = this;
    do {
      component.$emit(eventName, ...args);
      component = component.$parent;
    } while (component);
  };
});

// Register a global custom directive called `v-blur` that prevents focus
Vue.directive('blur', {
  inserted: function (el) {
    el.onfocus = (ev) => ev.target.blur()
  }
});

/**
 * Handle long taps. Call with the timeout as argument (default 500ms) and the value
 * can be either one function called on long tap or two functions, the
 * first called on "short tap" and the other on "long tap".
 * 
 * Like this: v-linkTap:500="[tapped,longTapped]"
 */
Vue.directive('longTap', {
  bind: function (el, binding, ignoredvnode) {
    el.longTapTimeout = parseInt(binding.arg || "500");
    el.longTapCallbacks = binding.value;
    for (var i = el.longTapCallbacks.length; i < 2; i++) {
      el.longTapCallbacks.splice(0, 0, null);
    }

    const touchX = function (event) {
      if (event.type.indexOf("mouse") !== -1) {
        return event.clientX;
      }
      return event.touches[0].clientX;
    };
    const touchY = function (event) {
      if (event.type.indexOf("mouse") !== -1) {
        return event.clientY;
      }
      return event.touches[0].clientY;
    };

    /**
      * Triggered when our "long tap" timer hits.
    */
    const touchTimerElapsed = function () {
      el.longTapHandled = true;
      el.longTapCallbacks[1] && el.longTapCallbacks[1].call();
      el.longTapTimer = null;
      el.classList.remove("waiting-for-long-tap");
    };

    const touchStart = function (e) {
        el.longTapHandled = false;
        el.longTapStartX = touchX(e);
        el.longTapStartY = touchY(e);
        el.longTapTimer = setTimeout(touchTimerElapsed, el.longTapTimeout);
        el.classList.add("waiting-for-long-tap");
        e.preventDefault();
    };

    const touchCancel = function () {
      el.longTapHandled = true;
      el.longTapTimer && clearTimeout(el.longTapTimer);
      el.longTapTimer = null;
      el.classList.remove("waiting-for-long-tap");
    };

    const touchEnd = function () {
      el.longTapTimer && clearTimeout(el.longTapTimer);
      el.longTapTimer = null;
      if (!el.longTapHandled) {
        // Not canceled or long tapped. Just a single tap. Do we have a handler?
        el.longTapCallbacks[0] && el.longTapCallbacks[0].call();
      }
      el.classList.remove("waiting-for-long-tap");
    };

    const touchMove = function (e) {
      el.longTapCurrentX = touchX(e);
      el.longTapCurrentY = touchY(e);
      var tapTolerance = 4;
      var touchMoved =
        Math.abs(el.longTapStartX - el.longTapCurrentX) > tapTolerance ||
        Math.abs(el.longTapStartY - el.longTapCurrentY) > tapTolerance;
      if (touchMoved) {
        touchCancel();
      }
    };

    el.longTapTouchStart = touchStart;
    el.longTapTouchEnd = touchEnd;
    el.longTapTouchCancel = touchCancel;
    el.longTapTouchMove = touchMove;
    el.addEventListener("touchstart", touchStart);
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("touchcancel", touchCancel);
    el.addEventListener("touchmove", touchMove);
    el.addEventListener("mousedown", touchStart);
    el.addEventListener("mouseup", touchEnd);
    el.addEventListener("mousemove", touchMove);
  },
  unbind: function (el) {
    el.longTapTimer && clearTimeout(el.longTapTimer);
    el.removeEventListener("touchstart", el.longTapTouchStart);
    el.removeEventListener("touchend", el.longTapTouchEnd);
    el.removeEventListener("touchcancel", el.longTapTouchCancel);
    el.removeEventListener("touchmove", el.longTapTouchMove);
    el.removeEventListener("mousedown", el.longTapTouchStart);
    el.removeEventListener("mouseup", el.longTapTouchEnd);
    el.removeEventListener("mousemove", el.longTapTouchMove);
  },
});

Vue.use(navigation, router);

new Vue({
  vuetify,
  store,
  router,
  i18n,
  matrix,
  cleaninsights,
  render: h => h(App)
}).$mount('#app');