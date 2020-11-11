<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
      v-on:scroll="onScroll"
    >
      <div v-for="event in events" :key="event.eventId">
        <!-- Contact joined the chat -->
        <div
          class="messageJoin"
          v-if="
            event.event.state_key != myUserId &&
            event.getContent().membership == 'join' &&
            event.getType() == 'm.room.member'
          "
        >
          {{ stateEventDisplayName(event) }} joined the chat
        </div>

        <!-- Contact left the chat -->
        <div
          class="messageJoin"
          v-if="
            event.event.state_key != myUserId &&
            event.getContent().membership == 'leave' &&
            event.getType() == 'm.room.member'
          "
        >
          {{ stateEventDisplayName(event) }} left the chat
        </div>

        <!-- Contact invited to the chat -->
        <div
          class="messageJoin"
          v-if="
            event.event.state_key != myUserId &&
            event.getContent().membership == 'invite' &&
            event.getType() == 'm.room.member'
          "
        >
          {{ stateEventDisplayName(event) }} was invited to the chat...
        </div>

        <div
          v-else-if="
            event.getSender() != myUserId && event.getType() == 'm.room.message'
          "
        >
          <div class="messageIn">
            <div class="sender">{{ messageEventDisplayName(event) }}</div>
            <v-avatar class="avatar" size="40" color="grey">
              <img v-if="messageEventAvatar(event)" :src="messageEventAvatar(event)" />
              <span v-else class="white--text headline">{{messageEventDisplayName(event).substring(0,1).toUpperCase()}}</span>
            </v-avatar>

            <div class="bubble">
              <div class="message">{{ event.getContent().body }}</div>
            </div>
          </div>
          <div class="time">
            {{ formatTime(event.event.origin_server_ts) }}
          </div>
        </div>
        <div v-else-if="event.getType() == 'm.room.message'">
          <div class="messageOut">
            <div class="sender">{{ "You" }}</div>
            <div class="bubble">
              <div class="message">{{ event.getContent().body }}</div>
            </div>
            <div class="status">{{ event.status }}</div>
          </div>
          <div class="time">
            {{ formatTime(event.event.origin_server_ts) }}
          </div>
        </div>

        <!-- ROOM NAME CHANGED -->
        <div v-else-if="event.getType() == 'm.room.name'" class="statusEvent">
          {{ stateEventDisplayName(event) }} changed room name to {{ event.getContent().name }}
        </div>

        <!-- ROOM TOPIC CHANGED -->
        <div v-else-if="event.getType() == 'm.room.topic'" class="statusEvent">
          {{ stateEventDisplayName(event) }} changed topic to {{ event.getContent().topic }}
        </div>

        <!-- ROOM AVATAR CHANGED -->
        <div v-else-if="event.getType() == 'm.room.avatar'" class="statusEvent">
          {{ stateEventDisplayName(event) }} changed the room avatar
        </div>

        <div v-else class="statusEvent">Event: {{ event.getType() }}
        </div>
      </div>
      <!-- CONTACT IS TYPING -->
      <div v-show="contactIsTyping" class="typing">Someone is typing...</div>
    </div>

    <!-- Input area -->
    <div class="input-area flex-grow-0 flex-shrink-0">
      <v-textarea
        ref="messageInput"
        full-width
        v-model="currentInput"
        no-resize
        class="input-message"
        placeholder="Send message"
        hide-details
      ></v-textarea>
      <div align-self="end" class="text-right">
        <v-btn
          elevation="0"
          @click.stop="sendMessage"
          :disabled="sendButtonDisabled"
          >Send</v-btn
        >
      </div>
    </div>
  </div>
</template>

<script>
import { TimelineWindow, EventTimeline } from "matrix-js-sdk";

// from https://kirbysayshi.com/2013/08/19/maintaining-scroll-position-knockoutjs-list.html
function ScrollPosition(node) {
  this.node = node;
  this.previousScrollHeightMinusTop = 0;
  this.readyFor = "up";
}

ScrollPosition.prototype.restore = function () {
  if (this.readyFor === "up") {
    this.node.scrollTop =
      this.node.scrollHeight - this.previousScrollHeightMinusTop;
  }

  // 'down' doesn't need to be special cased unless the
  // content was flowing upwards, which would only happen
  // if the container is position: absolute, bottom: 0 for
  // a Facebook messages effect
};

ScrollPosition.prototype.prepareFor = function (direction) {
  this.readyFor = direction || "up";
  this.previousScrollHeightMinusTop =
    this.node.scrollHeight - this.node.scrollTop;
};

export default {
  name: "Chat",

  data: () => ({
    room: null,
    events: [],
    currentInput: "",
    contactIsTyping: false,
    timelineWindow: null,
    scrollPosition: null,
  }),

  mounted() {
    const container = this.$refs.chatContainer;
    this.scrollPosition = new ScrollPosition(container);

    this.$matrix.on("Room.timeline", this.onEvent);
    this.$matrix.on("RoomMember.typing", this.onUserTyping);

  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
    this.$matrix.off("RoomMember.typing", this.onUserTyping);
  },

  computed: {
    myUserId() {
      return this.$store.state.auth.user.user_id;
    },
    roomId() {
      return this.$matrix.currentRoomId;
    },
    sendButtonDisabled() {
      return this.currentInput.length == 0;
    },
  },

  watch: {
    roomId() {
      console.log("Chat: Current room changed");

      // Clear old events
      this.events = [];
      this.timelineWindow = null;    
      this.contactIsTyping = false;

      if (!this.roomId) {
        return; // no room
      }

      this.room = this.$matrix.getRoom(this.roomId);
      if (!this.room) {
        return; // Not found
      }

      this.timelineWindow = new TimelineWindow(
        this.$matrix.matrixClient,
        this.room.getUnfilteredTimelineSet(),
        {}
      );
      this.timelineWindow.load(null, 20).then(() => {
        this.events = this.timelineWindow.getEvents();
        this.paginateBackIfNeeded();
      });
    },
  },

  methods: {
    paginateBackIfNeeded() {
        this.$nextTick(() => {
          const container = this.$refs.chatContainer;
          if (container.scrollHeight <= container.clientHeight) {
            this.handleScrolledToTop();
          }
        })
    },
    onScroll(ignoredevent) {
      const container = this.$refs.chatContainer;
      if (container.scrollTop == 0) {
        // Scrolled to top
        this.handleScrolledToTop();
      } else if (
        container.scrollHeight - container.scrollTop ==
        container.clientHeight
      ) {
        this.handleScrolledToBottom();
      }
    },
    onEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      this.paginateBackIfNeeded();
    },

    onUserTyping(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      console.log("Typing:", event);
    },

    /**
     * Get a display name given an event.
     */
    stateEventDisplayName(event) {
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
          return member.getAvatarUrl(this.$matrix.matrixClient.getHomeserverUrl(), 40, 40, "scale", true);
        }
      }
      return null;
    },

    sendMessage() {
      if (this.currentInput.length > 0) {
        this.sendMatrixMessage(this.currentInput);
        this.currentInput = "";
      }
    },

    sendMatrixMessage(body) {
      var content = {
        body: body,
        msgtype: "m.text",
      };
      this.$matrix.matrixClient.sendEvent(
        this.roomId,
        "m.room.message",
        content,
        "",
        (err, ignoredres) => {
          console.log(err);
        }
      );
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

    handleScrolledToTop() {
      console.log("@top");
      // const room = this.$matrix.getRoom(this.roomId);
      if (
        this.timelineWindow &&
        this.timelineWindow.canPaginate(EventTimeline.BACKWARDS)
      ) {
        this.timelineWindow
          .paginate(EventTimeline.BACKWARDS, 10, true)
          .then((success) => {
            if (success) {
              this.scrollPosition.prepareFor("up");
              this.events = this.timelineWindow.getEvents();
              this.$nextTick(() => {
                // restore scroll position!
                console.log("Restore scroll!");
                this.scrollPosition.restore();
              });
            }
          });
      }
    },

    handleScrolledToBottom() {
      console.log("@bottom");
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>