<template>
  <div
    :class="{
      'message-operations-picker': true,
      incoming: incoming,
      outgoing: !incoming,
    }"
  >
    <v-container fluid>
      <v-row>
        <v-col v-if="incoming">
          <v-btn icon @click.stop="addReply" class="ma-0 pa-0">
            <v-icon>reply</v-icon>
          </v-btn>
          <div>{{$t('menu.reply')}}</div>
        </v-col>
        <v-col v-if="isEditable">
          <v-btn icon @click.stop="edit" class="ma-0 pa-0">
            <v-icon>edit</v-icon>
          </v-btn>
          <div>{{$t('menu.edit')}}</div>
        </v-col>
        <v-col v-if="isRedactable">
          <v-btn icon @click.stop="redact" class="ma-0 pa-0">
            <v-icon>delete</v-icon>
          </v-btn>
          <div>{{$t('menu.delete')}}</div>
        </v-col>
        <v-col v-if="isDownloadable">
          <v-btn icon @click.stop="download" class="ma-0 pa-0">
            <v-icon>get_app</v-icon>
          </v-btn>
          <div>{{$t('menu.download')}}</div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import messageMixin from "./messageMixin";
import messageOperationsMixin from "./messageOperationsMixin";

export default {
  mixins: [messageMixin, messageOperationsMixin],
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>