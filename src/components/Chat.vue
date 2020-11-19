<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
      v-on:scroll="onScroll"
    >
      <div v-for="event in events" :key="event.getId()">
        <component
          :is="componentForEvent(event)"
          :room="room"
          :event="event" />
      </div>
    </div>

    <!-- Input area -->
    <div v-if="room" class="input-area flex-grow-0 flex-shrink-0">
      <!-- CONTACT IS TYPING -->
      <div v-show="contactIsTyping" class="typing">Someone is typing...</div>
      <v-textarea
        ref="messageInput"
        full-width
        v-model="currentInput"
        no-resize
        class="input-message"
        placeholder="Send message"
        hide-details
        background-color="white"
      >
        <template v-slot:prepend>
          <label icon flat>
            <v-icon>attachment</v-icon>
            <input
              ref="attachment"
              type="file"
              name="attachment"
              @change="pickAttachment($event)"
              accept="image/*"
              style="display: none"
            />
          </label>
        </template>
      </v-textarea>
      <div align-self="end" class="text-right">
        <v-btn
          elevation="0"
          @click.stop="sendMessage"
          :disabled="sendButtonDisabled"
          >Send</v-btn
        >
      </div>
    </div>

    <div v-if="currentImageInput">
      <v-dialog v-model="currentImageInput" class="ma-0 pa-0" width="50%">
        <v-card class="ma-0 pa-0">
          <v-card-text class="ma-0 pa-0">
            <v-img
              :aspect-ratio="1"
              :src="currentImageInput"
              contain
              style="max-height: 50vh"
            />
            <div v-if="currentSendError">{{ currentSendError }}</div>
            <div v-else>{{ currentSendProgress }}</div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="currentImageInput = null"
              >Cancel</v-btn
            >
            <v-btn color="primary" text @click="sendAttachment">Send</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { TimelineWindow, EventTimeline } from "matrix-js-sdk";
import MessageIncomingText from './messages/MessageIncomingText';
import MessageOutgoingText from './messages/MessageOutgoingText';
import ContactJoin from './messages/ContactJoin.vue';
import ContactLeave from './messages/ContactLeave.vue';
import ContactInvited from './messages/ContactInvited.vue';
import RoomNameChanged from './messages/RoomNameChanged.vue';
import RoomTopicChanged from './messages/RoomTopicChanged.vue';
import RoomAvatarChanged from './messages/RoomAvatarChanged.vue';
import DebugEvent from "./messages/DebugEvent.vue";
import MessageOutgoingImage from "./messages/MessageOutgoingImage.vue";
import MessageIncomingImage from "./messages/MessageIncomingImage.vue";

// from https://kirbysayshi.com/2013/08/19/maintaining-scroll-position-knockoutjs-list.html
function ScrollPosition(node) {
  this.node = node;
  this.previousScrollHeightMinusTop = 0;
  this.previousScrollTop = 0;
  this.readyFor = "up";
}

ScrollPosition.prototype.restore = function () {
  if (this.readyFor === "up") {
    this.node.scrollTop =
      this.node.scrollHeight - this.previousScrollHeightMinusTop;
  } else {
    this.node.scrollTop = this.previousScrollTop;
  }
};

ScrollPosition.prototype.prepareFor = function (direction) {
  this.readyFor = direction || "up";
  if (this.readyFor === "up") {
    this.previousScrollHeightMinusTop =
      this.node.scrollHeight - this.node.scrollTop;
  } else {
    this.previousScrollTop = this.node.scrollTop;
  }
};

export default {
  name: "Chat",

  components: {
    MessageIncomingText,
    MessageOutgoingText,
    ContactJoin,
    ContactLeave,
    ContactInvited,
    RoomNameChanged,
    RoomTopicChanged,
    RoomAvatarChanged,
    DebugEvent,
    MessageOutgoingImage,
    MessageIncomingImage
  },

  data() { return {
    room: null,
    events: [],
    currentInput: "",
    contactIsTyping: false,
    timelineWindow: null,
    scrollPosition: null,
    currentImageInput: null,
    currentImageInputPath: null,
    currentSendOperation: null,
    currentSendProgress: null,
    currentSendError: null,
  }},

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
    componentForEvent(event) {
      switch (event.getType()) {
        case 'm.room.member':
          if (event.event.state_key != this.myUserId) {
            if (event.getContent().membership == 'join') {
              return ContactJoin;
            } else if (event.getContent().membership == 'leave') {
              return ContactLeave;
            } else if (event.getContent().membership == 'invite') {
              return ContactInvited;
            }
          }
          break;

        case 'm.room.message':
          if (event.getSender() != this.myUserId) {
            if (event.getContent().msgtype == 'm.image') {
              return MessageIncomingImage;
            }
            return MessageIncomingText;
          } else {
            if (event.getContent().msgtype == 'm.image') {
              return MessageOutgoingImage;
            }
            return MessageOutgoingText;
          }

        case 'm.room.name':
          return RoomNameChanged;

        case 'm.room.topic':
          return RoomTopicChanged;

        case 'm.room.avatar':
          return RoomAvatarChanged;
      }
      return DebugEvent;
    },

    paginateBackIfNeeded() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        if (container.scrollHeight <= container.clientHeight) {
          this.handleScrolledToTop();
        }
      });
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
        this.handleScrolledToBottom(false);
      }
    },
    onEvent(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      this.paginateBackIfNeeded();

      // If we are at bottom, scroll to see new events...
      const container = this.$refs.chatContainer;
      if (
        container.scrollHeight - container.scrollTop ==
        container.clientHeight
      ) {
        this.handleScrolledToBottom(true);
      }
    },

    onUserTyping(event) {
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      console.log("Typing:", event);
    },

    sendMessage() {
      if (this.currentInput.length > 0) {
        this.sendMatrixMessage(this.currentInput);
        this.currentInput = "";
      }
    },

    /**
     * Show attachment picker to select image
     */
    pickAttachment(event) {
      if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
          this.currentImageInput = e.target.result;
          this.currentImageInputPath = event.target.files[0];
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    },

    onUploadProgress(p) {
      if (p.total) {
        this.currentSendProgress =
          "Uploaded " + (p.loaded || 0) + " of " + p.total;
      } else {
        this.currentSendProgress = "Uploaded " + (p.loaded || 0);
      }
    },

    sendAttachment() {
      if (this.currentImageInputPath) {
        const opts = {
          progressHandler: this.onUploadProgress,
        };
        this.currentSendOperation = this.$matrix.uploadFile(
          this.currentImageInputPath,
          opts
        );
        var matrixUri;
        this.currentSendOperation
          .then((uri) => {
            matrixUri = uri;
            return this.$matrix.matrixClient.sendImageMessage(
              this.roomId,
              matrixUri,
              "",
              "Image",
              null
            );
          })
          .then((result) => {
            console.log("Image sent: ", result);
          })
          .catch((err) => {
            console.log("Image send error: ", err);
            if (err && err.name == "UnknownDeviceError") {
              console.log("Unknown devices. Mark as known before retrying.");
              var setAsKnownPromises = [];
              for (var user of Object.keys(err.devices)) {
                const userDevices = err.devices[user];
                for (var deviceId of Object.keys(userDevices)) {
                  const deviceInfo = userDevices[deviceId];
                  if (!deviceInfo.known) {
                    setAsKnownPromises.push(
                      this.$matrix.matrixClient.setDeviceKnown(
                        user,
                        deviceId,
                        true
                      )
                    );
                  }
                }
              }
              Promise.all(setAsKnownPromises)
                .then(() => {
                  // All devices now marked as "known", try to resend
                  return this.$matrix.matrixClient.sendImageMessage(
                    this.roomId,
                    matrixUri,
                    "",
                    "Image",
                    null
                  );
                })
                .then((result) => {
                  console.log("Image sent: ", result);
                })
                .catch((err) => {
                  // Still error, abort
                  this.currentSendError = err.toLocaleString();
                });
            } else {
              this.currentSendError = err.toLocaleString();
            }
          });
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

    handleScrolledToTop() {
      console.log("@top");
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

    handleScrolledToBottom(scrollToEnd) {
      console.log("@bottom");
      if (
        this.timelineWindow &&
        this.timelineWindow.canPaginate(EventTimeline.FORWARDS)
      ) {
        this.timelineWindow
          .paginate(EventTimeline.FORWARDS, 10, true)
          .then((success) => {
            if (success) {
              this.scrollPosition.prepareFor("down");
              this.events = this.timelineWindow.getEvents();
              this.$nextTick(() => {
                // restore scroll position!
                console.log("Restore scroll!");
                this.scrollPosition.restore();
                if (scrollToEnd) {
                  this.smoothScrollToEnd();
                }
              });
            }
          });
      }
    },

    smoothScrollToEnd() {
      this.$nextTick(function () {
        const container = this.$refs.chatContainer;
        if (container.children.length > 0) {
          const lastChild = container.children[container.children.length - 1];
          console.log("Scroll into view", lastChild);
          window.requestAnimationFrame(() => {
            lastChild.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });
          });
        }
      });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>