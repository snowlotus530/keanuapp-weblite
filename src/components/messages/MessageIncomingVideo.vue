<template>
  <message-incoming v-bind="{ ...$props, ...$attrs }" v-on="$listeners">
    <div class="bubble image-bubble">
      <v-responsive :aspect-ratio="16 / 9" :src="src">
        <video :src="src" controls style="width: 100%; height: 100%">
          {{$t('fallbacks.video_file')}}
        </video>
        <div v-if="downloadProgress" class="download-overlay">
          <div class="text-center download-text">
            {{ $t('message.download_progress',{percentage: downloadProgress}) }}
          </div>
        </div>
      </v-responsive>
    </div>
  </message-incoming>
</template>

<script>
import attachmentMixin from "./attachmentMixin";
import MessageIncoming from "./MessageIncoming.vue";

export default {
  extends: MessageIncoming,
  components: { MessageIncoming },
  mixins: [attachmentMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>