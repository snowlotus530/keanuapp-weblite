<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <ChatHeader class="chat-header flex-grow-1 flex-shrink-1" />
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
      v-on:sscroll="onScroll"
    >
      <div v-for="event in events" :key="event.getId()">
        <div
          v-if="
            !event.isRelation() && !event.isRedacted() && !event.isRedaction()
          "
        >
          <div
            style="position: relative; user-select: none"
            v-on:touchstart="
              (e) => {
                touchStart(e, event);
              }
            "
            v-on:touchend="touchEnd"
            v-on:touchcancel="touchCancel"
            v-on:touchmove="touchMove"
          >
            <component
              :is="componentForEvent(event)"
              :room="room"
              :event="event"
              :reactions="
                timelineWindow._timelineSet.getRelationsForEvent(
                  event.getId(),
                  'm.annotation',
                  'm.reaction'
                )
              "
              v-on:send-quick-reaction="sendQuickReaction"
            />
            <message-operations
              v-on:close="showContextMenu = false"
              v-if="selectedEvent == event && showContextMenu"
              v-on:addreaction="addReaction"
              :event="event"
              :incoming="event.getSender() != $matrix.currentUserId"
            />
          </div>
        </div>
      </div>

      <!-- Handle resizes, e.g. when soft keyboard is shown/hidden -->
      <resize-observer
        ref="chatContainerResizer"
        @notify="handleChatContainerResize"
      />
    </div>

    <!-- Input area -->
    <v-container v-if="room" fluid class="input-area-outer">
      <v-row class="ma-0 pa-0">
        <!-- CONTACT IS TYPING -->
        <div class="typing">
          {{ contactIsTyping ? "Someone is typing..." : "" }}
        </div>
      </v-row>
      <v-row class="input-area-inner">
        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1">
          <label icon flat ref="attachmentLabel">
            <v-btn icon @click="$refs.attachment.click()">
              <v-icon>attachment</v-icon>
            </v-btn>
            <input
              ref="attachment"
              type="file"
              name="attachment"
              @change="pickAttachment($event)"
              accept="image/*|audio/*|video/*|application/pdf"
              style="display: none"
            />
          </label>
        </v-col>

        <v-col class="flex-grow-1 flex-shrink-1 ma-0 pa-0">
          <v-textarea
            height="undefined"
            ref="messageInput"
            full-width
            auto-grow
            rows="1"
            v-model="currentInput"
            no-resize
            class="input-area-text"
            placeholder="Send message"
            hide-details
            background-color="white"
            v-on:keydown.enter.prevent="() => { sendMessage() }"
          />
        </v-col>

        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1">
          <v-btn icon @click.stop="sendMessage" :disabled="sendButtonDisabled">
            <v-icon>send</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

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
            <v-btn color="primary" text @click="cancelSendAttachment"
              >Cancel</v-btn
            >
            <v-btn
              color="primary"
              text
              @click="sendAttachment"
              :disabled="currentSendOperation != null"
              >Send</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div v-if="showEmojiPicker">
      <v-dialog v-model="showEmojiPicker" class="ma-0 pa-0" width="50%">
        <VEmojiPicker style="width: 100%" @select="emojiSelected" />
      </v-dialog>
    </div>
  </div>
</template>

<script>
import { TimelineWindow, EventTimeline } from "matrix-js-sdk";
import MessageIncomingText from "./messages/MessageIncomingText";
import MessageIncomingImage from "./messages/MessageIncomingImage.vue";
import MessageIncomingAudio from "./messages/MessageIncomingAudio.vue";
import MessageOutgoingText from "./messages/MessageOutgoingText";
import MessageOutgoingImage from "./messages/MessageOutgoingImage.vue";
import MessageOutgoingAudio from "./messages/MessageOutgoingAudio.vue";
import ContactJoin from "./messages/ContactJoin.vue";
import ContactLeave from "./messages/ContactLeave.vue";
import ContactInvited from "./messages/ContactInvited.vue";
import RoomNameChanged from "./messages/RoomNameChanged.vue";
import RoomTopicChanged from "./messages/RoomTopicChanged.vue";
import RoomAvatarChanged from "./messages/RoomAvatarChanged.vue";
import DebugEvent from "./messages/DebugEvent.vue";
import util from "../plugins/utils";
import MessageOperations from "./messages/MessageOperations.vue";
import ChatHeader from "./ChatHeader";

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
    ChatHeader,
    MessageIncomingText,
    MessageIncomingImage,
    MessageIncomingAudio,
    MessageOutgoingText,
    MessageOutgoingImage,
    MessageOutgoingAudio,
    ContactJoin,
    ContactLeave,
    ContactInvited,
    RoomNameChanged,
    RoomTopicChanged,
    RoomAvatarChanged,
    DebugEvent,
    MessageOperations,
  },

  data() {
    return {
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
      showEmojiPicker: false,
      selectedEvent: null,
      showContextMenu: false,
      /**
       * Current chat container size. We need to keep track of this so that if and when
       * a soft keyboard is shown/hidden we can restore the scroll position correctly.
       * If we don't, the keyboard will simply overflow the message we are answering to etc.
       */
      chatContainerSize: 0,
    };
  },

  mounted() {
    const container = this.$refs.chatContainer;
    this.scrollPosition = new ScrollPosition(container);
    this.$matrix.on("Room.timeline", this.onEvent);
    this.$matrix.on("RoomMember.typing", this.onUserTyping);
    this.chatContainerSize = this.$refs.chatContainerResizer.$el.clientHeight;
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
    this.$matrix.off("RoomMember.typing", this.onUserTyping);
  },

  computed: {
    roomId() {
      return this.$matrix.currentRoomId;
    },
    sendButtonDisabled() {
      return this.currentInput.length == 0;
    },
  },

  watch: {
    roomId: {
      handler(ignoredNewVal, ignoredOldVal) {
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
          this.$nextTick(() => {
            this.paginateBackIfNeeded();
          });
        });
      },
      immediate: true,
    },
  },

  methods: {
    touchX(event) {
      if (event.type.indexOf("mouse") !== -1) {
        return event.clientX;
      }
      return event.touches[0].clientX;
    },
    touchY(event) {
      if (event.type.indexOf("mouse") !== -1) {
        return event.clientY;
      }
      return event.touches[0].clientY;
    },
    touchStart(e, event) {
      if (this.selectedEvent != event) {
        this.showContextMenu = false;
      }
      this.selectedEvent = event;
      this.touchStartX = this.touchX(e);
      this.touchStartY = this.touchY(e);
      this.touchTimer = setTimeout(this.touchTimerElapsed, 500);
    },
    touchEnd() {
      this.touchTimer && clearTimeout(this.touchTimer);
    },
    touchCancel() {
      this.touchTimer && clearTimeout(this.touchTimer);
    },
    touchMove(e) {
      this.touchCurrentX = this.touchX(e);
      this.touchCurrentY = this.touchY(e);
      var tapTolerance = 4;
      var touchMoved =
        Math.abs(this.touchStartX - this.touchCurrentX) > tapTolerance ||
        Math.abs(this.touchStartY - this.touchCurrentY) > tapTolerance;
      if (touchMoved) {
        this.touchTimer && clearTimeout(this.touchTimer);
      }
    },

    /**
     * Triggered when out "long tap" timer hits.
     */
    touchTimerElapsed() {
      this.showContextMenu = true;
    },

    /**
     * If chat container is shrunk (probably because soft keyboard is shown) adjust
     * the scroll position so that e.g. if we were looking at the last message when
     * moving focus to the input field, we would still see the last message. Otherwise
     * if would be hidden behind the keyboard.
     */
    handleChatContainerResize({ ignoredWidth, height }) {
      const delta = height - this.chatContainerSize;
      this.chatContainerSize = height;
      const container = this.$refs.chatContainer;
      if (delta < 0) {
        container.scrollTop -= delta;
      }
    },

    componentForEvent(event) {
      switch (event.getType()) {
        case "m.room.member":
          if (event.getContent().membership == "join") {
            return ContactJoin;
          } else if (event.getContent().membership == "leave") {
            return ContactLeave;
          } else if (event.getContent().membership == "invite") {
            return ContactInvited;
          }
          break;

        case "m.room.message":
          if (event.getSender() != this.$matrix.currentUserId) {
            if (event.getContent().msgtype == "m.image") {
              return MessageIncomingImage;
            } else if (event.getContent().msgtype == "m.audio") {
              return MessageIncomingAudio;
            }
            return MessageIncomingText;
          } else {
            if (event.getContent().msgtype == "m.image") {
              return MessageOutgoingImage;
            } else if (event.getContent().msgtype == "m.audio") {
              return MessageOutgoingAudio;
            }
            return MessageOutgoingText;
          }

        case "m.room.name":
          return RoomNameChanged;

        case "m.room.topic":
          return RoomTopicChanged;

        case "m.room.avatar":
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
        container.scrollHeight - container.scrollTop.toFixed(0) ==
        container.clientHeight
      ) {
        this.handleScrolledToBottom(false);
      }
    },
    onEvent(event) {
      console.log("OnEvent", event);
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }
      this.paginateBackIfNeeded();

      // If we are at bottom, scroll to see new events...
      const container = this.$refs.chatContainer;
      var scrollToSeeNew = event.getSender() == this.$matrix.currentUserId; // When we sent, scroll
      if (
        container.scrollHeight - container.scrollTop.toFixed(0) ==
        container.clientHeight
      ) {
        scrollToSeeNew = true;
      }
      if (event.forwardLooking) {
        this.handleScrolledToBottom(scrollToSeeNew);
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
        util
          .sendTextMessage(
            this.$matrix.matrixClient,
            this.roomId,
            this.currentInput
          )
          .then(() => {
            console.log("Sent message");
          })
          .catch((err) => {
            console.log("Failed to send:", err);
          });
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
        this.currentSendProgress = 0;
        this.currentSendOperation = util.sendImage(
          this.$matrix.matrixClient,
          this.roomId,
          this.currentImageInputPath,
          this.onUploadProgress
        );
        this.currentSendOperation
          .then(() => {
            this.currentSendOperation = null;
            this.currentImageInput = null;
            this.currentSendProgress = 0;
          })
          .catch((err) => {
            this.currentSendError = err.toLocaleString();
            this.currentSendOperation = null;
            this.currentSendProgress = 0;
          });
      }
    },

    cancelSendAttachment() {
      if (this.currentSendOperation) {
        this.currentSendOperation.reject("Canceled");
      }
      this.currentSendOperation = null;
      this.currentImageInput = null;
      this.currentSendProgress = 0;
      this.currentSendError = null;
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

    addReaction(e) {
      const event = e.event;
      // Store the event we are reacting to, so that we know where to
      // send when the picker closes.
      this.selectedEvent = event;
      this.showEmojiPicker = true;
    },

    emojiSelected(e) {
      this.showEmojiPicker = false;
      if (this.selectedEvent) {
        const event = this.selectedEvent;
        this.selectedEvent = null;
        this.sendQuickReaction({ reaction: e.data, event: event });
      }
    },

    sendQuickReaction(e) {
      util
        .sendQuickReaction(
          this.$matrix.matrixClient,
          this.roomId,
          e.reaction,
          e.event
        )
        .then(() => {
          console.log("Quick reaction message");
        })
        .catch((err) => {
          console.log("Failed to send quick reaction:", err);
        });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>