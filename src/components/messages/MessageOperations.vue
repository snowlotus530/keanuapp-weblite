<template>
  <div :class="{'message-operations':true,'incoming':incoming,'outgoing':!incoming}">
    <template v-for="(item,index) in emojis">
      <v-btn v-if="index < maxRecents" :key="item.data" icon @click.stop="addQuickReaction(item.data)" class="ma-0 pa-0">
        <span class="recent-emoji" >{{ item.data }}</span>
      </v-btn>
    </template>
    <v-btn v-if="incoming" icon @click.stop="addReply" class="ma-0 pa-0">
      <v-icon>reply</v-icon>
    </v-btn>
    <v-btn icon @click.stop="more" class="ma-0 pa-0">
      <v-icon>more_horiz</v-icon>
    </v-btn>  </div>
</template>

<script>
import messageMixin from "./messageMixin";
import messageOperationsMixin from "./messageOperationsMixin";

export default {
  mixins: [messageMixin, messageOperationsMixin],
  data() {
    return {
      maxRecents: 5
    }
  },
  props: {
    emojis: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  
  watch: {
    emojis: {
      immediate: true,
      handler(newVal, oldVal) {
        console.log("Emojis changed", newVal, oldVal);
      }
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";

// .recent-emoji {
//   width: 30px;
// }

</style>