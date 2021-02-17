<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <ChatHeader class="chat-header flex-grow-1 flex-shrink-1" />
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
      v-on:scroll="onScroll"
      @click.prevent="closeContextMenuIfOpen"
    >
      <div ref="messageOperationsStrut" class="message-operations-strut">
      <message-operations
        :style="opStyle"
              v-on:close="showContextMenu = false"
              v-if="selectedEvent && showContextMenu"
              v-on:addreaction="addReaction"
              v-on:addreply="addReply(selectedEvent)"
              v-on:edit="edit(selectedEvent)"
              v-on:redact="redact(selectedEvent)"
              v-on:download="download(selectedEvent)"
              :event="selectedEvent"
              :incoming="selectedEvent.getSender() != $matrix.currentUserId"
            />
    </div>

      <!-- Handle resizes, e.g. when soft keyboard is shown/hidden -->
      <resize-observer
        ref="chatContainerResizer"
        @notify="handleChatContainerResize"
      />

      <div v-for="(event,index) in events" :key="event.getId()" :eventId="event.getId()">
       
       <!-- DAY Marker, shown for every new day in the timeline -->
        <div v-if="showDayMarkerBeforeEvent(event)" class="day-marker" :title="dayForEvent(event)" />
        
        <div
          v-if="
            !event.isRelation() && !event.isRedacted() && !event.isRedaction()
          "
          :ref="event.getId()"
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
              :nextEvent="events[index + 1]"
              :reactions="
                timelineWindow._timelineSet.getRelationsForEvent(
                  event.getId(),
                  'm.annotation',
                  'm.reaction'
                )
              "
              :timelineSet="timelineWindow._timelineSet"
              v-on:send-quick-reaction="sendQuickReaction"
              v-on:context-menu="showContextMenuForEvent($event)"
            />
            <!-- <div>EventID: {{ event.getId() }}</div> -->
            <div v-if="event.getId() == readMarker && index < (events.length - 1)" class="read-marker" title="Unread messages" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <v-container v-if="room" fluid class="input-area-outer">
      <v-row class="ma-0 pa-0">
        <div v-if="replyToEvent">REPLYING TO EVENT: {{ replyToEvent.getContent().body }}</div>

        <!-- CONTACT IS TYPING -->
        <div class="typing">
          {{ typingMembersString }}
        </div>
      </v-row>
      <v-row class="input-area-inner align-center">
        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1">
          <label icon flat ref="attachmentLabel">
            <v-btn icon large color="black" @click="showAttachmentPicker" :disabled="attachButtonDisabled">
              <v-icon x-large>add_circle_outline</v-icon>
            </v-btn>
            <input
              ref="attachment"
              type="file"
              name="attachment"
              @change="handlePickedAttachment($event)"
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

        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1" v-if="editedEvent || replyToEvent">
          <v-btn fab small elevation="0" color="black" @click.stop="cancelEditReply">
            <v-icon color="white">cancel</v-icon>
          </v-btn>
        </v-col>
        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1">
          <v-btn fab small elevation="0" color="black" @click.stop="sendMessage" :disabled="sendButtonDisabled">
            <v-icon color="white">{{ editedEvent ? 'save' : 'arrow_upward' }}</v-icon>
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
      <v-dialog v-model="showEmojiPicker" class="ma-0 pa-0">
        <VEmojiPicker style="width: 100%" @select="emojiSelected" />
      </v-dialog>
    </div>

    <!-- "NOT ALLOWED FOR GUEST ACCOUNTS" dialog -->
      <v-dialog v-model="showNotAllowedForGuests" class="ma-0 pa-0" width="50%">
        <v-card>
          <v-card-title>You are logged in as a guest</v-card-title>
          <v-card-text>
            <div>Unfortunately guests are not allowed to upload files.</div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showNotAllowedForGuests = false">Ok</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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

const READ_RECEIPT_TIMEOUT = 5000; /* How long a message must have been visible before the read marker is updated */

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
      events: [],
      currentInput: "",
      typingMembers: [],
      timelineWindow: null,
      scrollPosition: null,
      currentImageInput: null,
      currentImageInputPath: null,
      currentSendOperation: null,
      currentSendProgress: null,
      currentSendError: null,
      showEmojiPicker: false,
      selectedEvent: null,
      editedEvent: null,
      replyToEvent: null,
      showContextMenu: false,
      showContextMenuAnchor: null,
      initialLoadDone: false,

      /**
       * Current chat container size. We need to keep track of this so that if and when
       * a soft keyboard is shown/hidden we can restore the scroll position correctly.
       * If we don't, the keyboard will simply overflow the message we are answering to etc.
       */
      chatContainerSize: 0,

      /** Shows a dialog with info about an operation being disallowed for guests */
      showNotAllowedForGuests: false,

      /** A timer for read receipts. */
      rrTimer: null,

      /** Last event we sent a Read Receipt/Read Marker for */
      lastRR: null,
    };
  },

  mounted() {
    const container = this.$refs.chatContainer;
    this.scrollPosition = new ScrollPosition(container);
    this.$matrix.on("Room.timeline", this.onEvent);
    this.$matrix.on("RoomMember.typing", this.onUserTyping);
    this.chatContainerSize = this.$refs.chatContainerResizer.$el.clientHeight;
  },

  beforeDestroy() {
    this.stopRRTimer();
  },

  destroyed() {
    this.$matrix.off("Room.timeline", this.onEvent);
    this.$matrix.off("RoomMember.typing", this.onUserTyping);
  },

  computed: {
    currentUser() {
      return this.$store.state.auth.user;
    },
    room() {
      return this.$matrix.currentRoom;
    },
    roomId() {
      if (this.room) {
        return this.room.roomId;
      }
      return this.$matrix.currentRoomId;
    },
    roomAliasOrId() {
      if (this.room) {
        return this.room.getCanonicalAlias() || this.room.roomId;
      }
      return this.$matrix.currentRoomId;
    },
    readMarker() {
      if (this.lastRR) {
        // If we have sent a RR, use that as read marker (so we don't have to wait for server round trip)
        return this.lastRR.getId();
      }
      return this.fullyReadMarker || this.room.getEventReadUpTo(this.$matrix.currentUserId, false);
    },
    fullyReadMarker() {
      const readEvent = this.room.getAccountData('m.fully_read');
      if (readEvent) {
        return readEvent.getContent().event_id;
      }
      return null;
    },
    attachButtonDisabled() {
      return this.editedEvent != null || this.replyToEvent != null || this.currentInput.length > 0;
    },
    sendButtonDisabled() {
      return this.currentInput.length == 0;
    },
    typingMembersString() {
      const count = this.typingMembers.length;
      if (count > 1) {
        return "" + count + " members are typing";
      } else if (count > 0) {
        return this.typingMembers[0].name + " is typing";
      } else {
        return "";
      }
    },
    opStyle() {
      // Calculate where to show the context menu.
      //
      const ref = this.selectedEvent && this.$refs[this.selectedEvent.getId()];
      var top = 0;
      var left = 0;
      if (ref && ref[0]) {
        if (this.showContextMenuAnchor) {
          var rectAnchor = this.showContextMenuAnchor.getBoundingClientRect();
          var rectChat = this.$refs.messageOperationsStrut.getBoundingClientRect();
          top = rectAnchor.top - rectChat.top;
          left = rectAnchor.left - rectChat.left;
        }
      }
      return "top:" + top + "px;left:" + left + "px";
    }

  },

  watch: {
    roomId: {
      immediate: true,
      handler(value, oldValue) {
        if (value && value == oldValue) {
          return; // No change.
        }
        console.log("Chat: Current room changed to " + (value ? value : "null"));

        // Clear old events
        this.events = [];
        this.timelineWindow = null;
        this.typingMembers = [];
        this.initialLoadDone = false;

        // Stop RR timer
        this.stopRRTimer();
        this.lastRR = null;

        if (!this.room) {
          // Public room?
          if (this.roomId && this.roomId.startsWith('#')) {
            this.onRoomNotJoined();
          }
          return; // no room
        }

          // Joined?
          if (this.room.hasMembershipState(this.currentUser.user_id, "join")) {
            // Yes, load everything
            this.onRoomJoined();
          } else {
            this.onRoomNotJoined();
          }
      }
    },
  },

  methods: {
    onRoomJoined() {

      var initialEventId = this.readMarker;
      console.log("Read up to " + initialEventId);

      //initialEventId = null;
      
      this.timelineWindow = new TimelineWindow(
          this.$matrix.matrixClient,
          this.room.getUnfilteredTimelineSet(),
          {}
      );
      const self = this;
      this.timelineWindow.load(initialEventId, 20).then(() => {
        console.log("This is", self);
          self.events = self.timelineWindow.getEvents();

          const getMoreIfNeeded = function _getMoreIfNeeded() {
            const container = self.$refs.chatContainer;
            if (container.scrollHeight <= container.clientHeight && 
              self.timelineWindow &&
              self.timelineWindow.canPaginate(EventTimeline.BACKWARDS)) {
                return self.timelineWindow.paginate(EventTimeline.BACKWARDS, 10, true)
                  .then(success => {
                    if (success) {
                      self.events = self.timelineWindow.getEvents();
                      return _getMoreIfNeeded.call(self);
                    } else {
                        return Promise.reject("Failed to paginate");
                      }
                    });
            } else {
              return Promise.resolve("Done");
            }            
          }.bind(self);

          getMoreIfNeeded()
          .catch(err => {
            console.log("ERROR " + err);
          })
          .finally(() => {
            self.initialLoadDone = true;
          if (initialEventId) {
            self.scrollToEvent(initialEventId);
          }
          self.restartRRTimer();
          });
        });
    },

    onRoomNotJoined() {
      this.$navigation.push({ name: "Join", params: { roomId: util.sanitizeRoomId(this.roomAliasOrId) }}, 0);
    },

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
      if (!container) {
        return;
      }
      if (container.scrollTop == 0) {
        // Scrolled to top
        this.handleScrolledToTop();
      } else if (
        container.scrollHeight - container.scrollTop.toFixed(0) ==
        container.clientHeight
      ) {
        this.handleScrolledToBottom(false);
      }
      this.restartRRTimer();
    },
    onEvent(event) {
      console.log("OnEvent", JSON.stringify(event));
      if (event.getRoomId() !== this.roomId) {
        return; // Not for this room
      }

      if (this.initialLoadDone) {
        this.paginateBackIfNeeded();
      }

      // If we are at bottom, scroll to see new events...
      const container = this.$refs.chatContainer;
      var scrollToSeeNew = event.getSender() == this.$matrix.currentUserId; // When we sent, scroll
      if (
        container.scrollHeight - container.scrollTop.toFixed(0) ==
        container.clientHeight
      ) {
        scrollToSeeNew = true;
      }
      if (this.initialLoadDone && event.forwardLooking && !event.isRelation()) {
        this.handleScrolledToBottom(scrollToSeeNew);
      }
    },

    onUserTyping(event, member) {
      if (member.roomId !== this.roomId) {
        return; // Not for this room
      }
      if (member.typing) {
        if (!this.typingMembers.includes(member)) {
          this.typingMembers.push(member);
        }
      } else {
        const index = this.typingMembers.indexOf(member);
        if (index > -1) {
          this.typingMembers.splice(index, 1);   
        }
      }
      console.log("Typing: ", this.typingMembers);
    },

    sendMessage() {
      if (this.currentInput.length > 0) {
        util
          .sendTextMessage(
            this.$matrix.matrixClient,
            this.roomId,
            this.currentInput,
            this.editedEvent,
            this.replyToEvent
          )
          .then(() => {
            console.log("Sent message");
          })
          .catch((err) => {
            console.log("Failed to send:", err);
          });
        this.currentInput = "";
        this.editedEvent = null; //TODO - Is this a good place to reset this?
        this.replyToEvent = null;
      }
    },

    /**
     * Show attachment picker to select file
     */
    showAttachmentPicker() {
      // Guests not currently allowed to send attachments (=actually upload them)
      // See https://matrix.org/docs/spec/client_server/r0.2.0#guest-access
      // if (this.$matrix.currentUser && this.$matrix.currentUser.is_guest) {
      //   this.showNotAllowedForGuests = true;
      //   return;
      // }
      this.$refs.attachment.click()
    },

    /**
     * Handle picked attachment
     */
    handlePickedAttachment(event) {
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

    /**
    * Scroll so that the given event is at the middle of the chat view (if more events) or else at the bottom.
    */
    scrollToEvent(eventId) {
      const container = this.$refs.chatContainer;
      const ref = this.$refs[eventId];
      if (container && ref) {
        const targetY = container.clientHeight / 2;
        const sourceY = ref[0].offsetTop;
        container.scrollTo(0, sourceY - targetY);
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

    addReply(event) {
      this.replyToEvent = event;
      this.$refs.messageInput.focus();
    },

    edit(event) {
      this.editedEvent = event;
      this.currentInput = event.getContent().body;
      this.$refs.messageInput.focus();
    },

    redact(event) {
      this.$matrix.matrixClient.redactEvent(event.getRoomId(), event.getId())
      .then(() => {
        console.log("Message redacted");
      })
      .catch(err => {
        console.log("Redaction failed: ", err);
      })
    },

    download(event) {
      util
        .getAttachment(this.$matrix.matrixClient, event)
        .then((url) => {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.download = event.getContent().body || "Download";
          link.click();
          URL.revokeObjectURL(url);
        })
        .catch((err) => {
          console.log("Failed to fetch attachment: ", err);
        });
    },

    cancelEditReply() {
      this.currentInput = "";
      this.editedEvent = null;
      this.replyToEvent = null;
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

    showContextMenuForEvent(e) {
      const event = e.event;
      const ref = this.$refs[event.getId()];
      if (ref) {
        console.log("Got the ref", ref);
      }
      this.selectedEvent = event;
      this.showContextMenu = true;
      this.showContextMenuAnchor = e.anchor;
    },

    closeContextMenuIfOpen(e) {
      if (this.showContextMenu) {
        this.showContextMenu = false;
        e.preventDefault();
      }
    },

    /** Stop Read Receipt timer */
    stopRRTimer() {
      if (this.rrTimer) {
        clearInterval(this.rrTimer);
        this.rrTimer = null;
      }
    },
    
    /**
    * Start/restart the timer to Read Receipts.
    */
    restartRRTimer() {
      this.stopRRTimer();
      this.rrTimer = setInterval(this.rrTimerElapsed, READ_RECEIPT_TIMEOUT);
    },

    rrTimerElapsed() {
      const container = this.$refs.chatContainer;
      const el = util.getLastVisibleElement(container);
      if (el) {
        const eventId = el.getAttribute('eventId');
        if (eventId && this.room) {
          const event = this.room.findEventById(eventId);
          if (event && (!this.lastRR || event.getTs() > this.lastRR.getTs())) {
            
            // Disable timer while we are sending
            clearInterval(this.rrTimer);
            this.rrTimer = null;

            // Send read receipt
            this.$matrix.matrixClient.sendReadReceipt(event)
            .then(() => {
              this.$matrix.matrixClient.setRoomReadMarkers(this.room.roomId, eventId)
            })
            .then(() => {
              console.log("RR sent for event: " + eventId);
              this.lastRR = event;             
            })
            .catch(err => {
              console.log("Failed to update read marker: ", err);
            })
            .finally(() => {
              this.restartRRTimer();
            });
          }
        }
      }
    },

    showDayMarkerBeforeEvent(event) {
      const idx = this.events.indexOf(event);
      if (idx <= 0) {
        return true;
      }
      const previousEvent = this.events[idx - 1];
      return util.dayDiff(previousEvent.getTs(), event.getTs()) > 0;
    },

    dayForEvent(event) {
      return util.formatDay(event.getTs());
    }
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>