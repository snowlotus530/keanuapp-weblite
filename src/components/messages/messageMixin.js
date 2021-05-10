import QuickReactions from './QuickReactions.vue';
var linkify = require('linkifyjs');
var linkifyHtml = require('linkifyjs/html');
linkify.options.defaults.className = "link";
linkify.options.defaults.target = null;

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
    nextEvent: {
      type: Object,
      default: function () {
        return null
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
        if (originalEvent) {
          this.inReplyToEvent = originalEvent;
          this.inReplyToSender = this.messageEventDisplayName(originalEvent);
        }
      }
    }
  },
  computed: {
    incoming() {
      return this.event && this.event.getSender() != this.$matrix.currentUserId;
    },

    /**
     * Don't show sender and time if the next event is within 2 minutes and also from us (= back to back messages)
     */
    showSenderAndTime() {
      if (this.nextEvent && this.nextEvent.getSender() == this.event.getSender()) {
        const ts1 = this.nextEvent.event.origin_server_ts;
        const ts2 = this.event.event.origin_server_ts;
        return (ts1 - ts2) < (2 * 60 * 1000); // less than 2 minutes
      }
      return true;
    },

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
    },

    /**
     * Classes to set for the message. Currently only for "messageIn", TODO: - detect messageIn or messageOut.
     */
  
    messageClasses() {
      return {'messageIn':true,'from-admin':this.senderIsAdminOrModerator(this.event)}
    },

    userAvatar() {
      if (!this.$matrix.userAvatar) {
        return null;
      }
      return this.$matrix.matrixClient.mxcUrlToHttp(
        this.$matrix.userAvatar,
        80,
        80,
        "scale",
        true
      );
    },

    userAvatarLetter() {
      if (!this.$matrix.currentUser) {
        return null;
      }
      return (this.$matrix.currentUserDisplayName || this.$matrix.currentUserId.substring(1)).substring(0, 1).toUpperCase();
    }
  },
  methods: {
    ownAvatarClicked() {
      this.$emit("own-avatar-clicked", {event: this.event});
    },

    otherAvatarClicked(avatarRef) {
      this.$emit("other-avatar-clicked", {event: this.event, anchor: avatarRef});
    },

    showContextMenu(buttonRef) {
      this.$emit("context-menu", {event: this.event,anchor: buttonRef});
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

    /**
     * Return true if the event sender has a powel level > 0, e.g. is moderator or admin of some sort.
     */
    senderIsAdminOrModerator(event) {
      if (this.room) {
        const member = this.room.getMember(event.getSender());
        if (member) {
          return member.powerLevel > 0;
        }
      }
      return false;
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

    linkify(text) {
      return linkifyHtml(text);
    }
  },
}