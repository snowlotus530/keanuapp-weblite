import QuickReactions from './QuickReactions.vue';

export default {
  components: {
    QuickReactions
  },
  props: {
    room: {
      type: Object,
      default: function () {
        return null
      }
    },
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
    },
    timelineSet: {
      type: Object,
      default: function () {
        return null
      }
    },
  },
  data() {
    return {
      inReplyToEvent: null,
      inReplyToSender: null
    }
  },
  mounted() {
    const relatesTo = this.event.getWireContent()['m.relates_to'];
    if (relatesTo && relatesTo['m.in_reply_to'])
    {
      // Can we find the original message?
      const originalEventId = relatesTo['m.in_reply_to'].event_id;
      if (originalEventId && this.timelineSet) {
        const originalEvent = this.timelineSet.findEventById(originalEventId);
        this.inReplyToEvent = originalEvent;
        this.inReplyToSender = this.messageEventDisplayName(originalEvent);
      }
    }
  },
  computed: {
    inReplyToText() {
      const relatesTo = this.event.getWireContent()['m.relates_to'];
      if (relatesTo && relatesTo['m.in_reply_to'])
      {
        const content = this.event.getContent();

        const lines = content.body.split('\n').reverse();
        while (lines.length && !lines[0].startsWith('> ')) lines.shift();
        // Reply fallback has a blank line after it, so remove it to prevent leading newline
        if (lines[0] === '') lines.shift();
        const text = lines
        .map((item) => { return item.replace(/^> (<.*> )?/g, ''); })
        .reverse()
        .join('\n');
        if (text) {
          return text;
        }

        if (this.inReplyToEvent) {
          var c = this.inReplyToEvent.getContent();
          return c.body;
        }

        // We don't have the original text (at the moment at least)
        return  "<original text>";
      }
      return null;
    },

    messageText() {
      const relatesTo = this.event.getWireContent()['m.relates_to'];
      if (relatesTo && relatesTo['m.in_reply_to'])
      {
        const content = this.event.getContent();

        // Remove the new text and strip "> " from the old original text
        const lines = content.body.split('\n');
        while (lines.length && lines[0].startsWith('> ')) lines.shift();
        // Reply fallback has a blank line after it, so remove it to prevent leading newline
        if (lines[0] === '') lines.shift();
        return lines.join('\n');
      }
      return this.event.getContent().body;
    }
  },
  methods: {
    showContextMenu() {
      this.$emit("context-menu", this.event);
    },

    /**
     * Get a display name given an event.
     */
    stateEventDisplayName(event) {
      if (event.getSender() == this.$matrix.currentUserId) {
        return "You";
      }
      if (this.room) {
        const member = this.room.getMember(event.getSender());
        if (member) {
          return member.name;
        }
      }
      return event.getContent().displayname || event.event.state_key;
    },

    messageEventDisplayName(event) {
      return this.stateEventDisplayName(event);
    },

    messageEventAvatar(event) {
      if (this.room) {
        const member = this.room.getMember(event.getSender());
        if (member) {
          return member.getAvatarUrl(
            this.$matrix.matrixClient.getHomeserverUrl(),
            40,
            40,
            "scale",
            true
          );
        }
      }
      return null;
    },

    formatTime(time) {
      const date = new Date();
      date.setTime(time);

      const today = new Date();
      if (
        date.getDate() == today.getDate() &&
        date.getMonth() == today.getMonth() &&
        date.getFullYear() == today.getFullYear()
      ) {
        // For today, skip the date part
        return date.toLocaleTimeString();
      }
      return date.toLocaleString();
    },
  },
}