<template>
<div>
  <div
    :class="{ 'voice-recorder-lock': true, 'locked': isLocked }"
    ref="vr_lock"
  >
  <div :class="{ 'thumb': true, 'locked': isLocked }" />
  </div>
</div>
</template>
<script>

export default {
  name: "VoiceRecorderLock",
  props: {
    isLocked: {
      type: Boolean,
      default: function () {
        return false;
      },
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style> 