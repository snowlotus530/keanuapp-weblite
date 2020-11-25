<template>
  <div class="quick-reaction-container">
    <span :class="{'quick-reaction':true,'sent':value.includes($matrix.currentUserId)}" v-for="(value, name) in reactionMap" :key="name" @mousedown="onClickEmoji(name)">
      {{ name }} <span class="quick-reaction-count">{{ value.length }}</span>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    event: {
      type: Object,
      default: function () {
        return {}
      }
    },
    reactions: {
      type: Object,
      default: function () {
        return null
      }
    }
  },
  data() {
    return {
      reactionMap: {}
    }
  },
  beforeDestroy() {
    if (this.reactions) {
      this.reactions.off('Relations.add', this.onAddRelation);
    }
  },
  methods: {
    onClickEmoji(emoji) {
      this.$bubble('send-quick-reaction', {reaction:emoji, event:this.event});
    },
    onAddRelation(ignoredevent) {
      this.processReactions();
    },
    processReactions() {
        var reactionMap = {};
      if (this.reactions && this.reactions._eventsCount > 0) {
        const relations = this.reactions.getRelations();
        for (const r of relations) {
          const emoji = r.getRelation().key;
          const sender = r.getSender();
          if (reactionMap[emoji]) {
            const array = reactionMap[emoji];
            if (!array.includes(sender)) {
              array.push(sender)
            }
          } else {
            reactionMap[emoji] = [sender];
          }
        }
      }
      this.reactionMap = reactionMap;
    }
  },
  watch: {
     reactions: {
       handler(newValue, oldValue) {
         if (oldValue) {
           oldValue.off('Relations.add', this.onAddRelation);
         }
         if (newValue) {
          newValue.on('Relations.add', this.onAddRelation);           
         }
         this.processReactions();
      },
      immediate: true
    }
  }
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>