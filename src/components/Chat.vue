<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
    >
      <div v-for="(event, index) in events" :key="index">
        <!-- Contact joined the chat -->
        <div
          class="messageJoin"
          v-if="
            event.event.state_key != myAddress &&
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
            event.event.state_key != myAddress &&
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
            event.event.state_key != myAddress &&
            event.getContent().membership == 'invite' &&
            event.getType() == 'm.room.member'
          "
        >
          {{ stateEventDisplayName(event) }} was invited to the chat...
        </div>

        <div
          v-else-if="
            event.getSender() != myAddress &&
            event.getType() == 'm.room.message'
          "
        >
          <div class="messageIn">
            <div class="sender">{{ event.getSender() }}</div>
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
          </div>
          <div class="time">
            {{ formatTime(event.event.origin_server_ts) }}
          </div>
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
export default {
  name: "Chat",

  data: () => ({
    events: [],
    currentInput: "",
    contactIsTyping: false,
  }),

  computed: {
    room() {
      return this.$store.state.currentRoom;
    },
    roomId() {
      return this.room != null ? this.room.roomId : null;
    },
    sendButtonDisabled() {
      return this.currentInput.length == 0;
    },
    myAddress() {
      // TODO
      return "@npex2:neo.keanu.im";
    },
  },

  watch: {
    room() {
      console.log("Chat: Current room changed");

      // Clear old events
      this.events = [];

      // Remove all old room listeners
      this.$matrixClient.removeAllListeners("Room.timeline");
      this.$matrixClient.removeAllListeners("RoomMember.typing");

      this.contactIsTyping = false;

      if (!this.room) {
        return; // no room
      }

      this.room.timeline.forEach((event) => {
        this.handleMatrixEvent(event);
      });

      // Add event listener for this room
      this.$matrixClient.on(
        "Room.timeline",
        function (event, ignoredroom, ignoredtoStartOfTimeline) {
          if (event.getRoomId() !== this.roomId) {
            return; // Not for this room
          }
          if (this.handleMatrixEvent(event)) {
            this.$nextTick(function () {
              const container = this.$refs.chatContainer;
              if (container.children.length > 0) {
                const lastChild =
                  container.children[container.children.length - 1];
                console.log("Scroll into view", lastChild);
                window.requestAnimationFrame(() => {
                  lastChild.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest",
                  });
                });
              }
            });
          }
        }.bind(this)
      );

      this.$matrixClient.on(
        "RoomMember.typing",
        function (event, member) {
          if (member.userId == this.contactAddress) {
            this.contactIsTyping = member.typing;
          }
        }.bind(this)
      );
    },
  },

  methods: {
    /**
     * Handle a matrix event. Add it to our array if valid type.
     * @returns True if the event was added, false otherwise.
     */
    handleMatrixEvent(event) {
      console.log("Type is", event.getType());

      if (event.getType() == "m.room.encryption") {
        this.$root.matrixClient.setRoomEncryption(
          event.event.room_id,
          event.getContent()
        );
      }

      const allowedEvents = [
        "m.room.message",
        "m.room.member",
        "m.room.encrypted",
      ];
      if (allowedEvents.includes(event.getType())) {
        console.log("Add event", event);
        this.events.push(event);
        return true;
      } else {
        console.log("Ignore event", event);
        return false;
      }
    },

    /**
     * Get a display name given an event.
     */
    stateEventDisplayName(event) {
      return event.getContent().displayname || event.event.state_key;
    },

    sendMessage() {
      if (this.currentInput.length > 0) {
        this.sendMatrixMessage(this.currentInput);
        this.currentInput = "";
      }
    },

    sendMatrixMessage(body) {
      // Send chat message sent event
      window.logtag("event", "chat_message_sent", {
        event_category: "chat",
      });

      var content = {
        body: body,
        msgtype: "m.notice",
      };
      this.$root.matrixClient.sendEvent(
        this.currentRoomId,
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
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>