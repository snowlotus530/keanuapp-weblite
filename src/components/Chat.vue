<template>
  <div class="chat-root fill-height d-flex flex-column" ma-0 pa-0>
    <ChatHeader
      class="chat-header flex-grow-0 flex-shrink-0"
      v-on:header-click="$refs.roomInfoSheet.open()"
    />
    <div
      class="chat-content flex-grow-1 flex-shrink-1"
      ref="chatContainer"
      style="overflow-x: hidden; overflow-y: auto"
      v-on:scroll="onScroll"
      @click="closeContextMenusIfOpen"
    >
      <div ref="messageOperationsStrut" class="message-operations-strut">
        <message-operations
          ref="messageOperations"
          :style="opStyle"
          :emojis="recentEmojis"
          v-on:close="
            showContextMenu = false;
            showContextMenuAnchor = null;
          "
          v-if="selectedEvent && showContextMenu"
          v-on:addreaction="addReaction"
          v-on:addquickreaction="addQuickReaction"
          v-on:addreply="addReply(selectedEvent)"
          v-on:edit="edit(selectedEvent)"
          v-on:redact="redact(selectedEvent)"
          v-on:download="download(selectedEvent)"
          v-on:more="showMoreMessageOperations"
          :event="selectedEvent"
        />
      </div>

      <div ref="avatarOperationsStrut" class="avatar-operations-strut">
        <avatar-operations
          ref="avatarOperations"
          :style="avatarOpStyle"
          v-on:close="
            showAvatarMenu = false;
            showAvatarMenuAnchor = null;
          "
          v-on:start-private-chat="startPrivateChat($event)"
          v-if="selectedEvent && showAvatarMenu"
          :room="room"
          :event="selectedEvent"
        />
      </div>

      <!-- Handle resizes, e.g. when soft keyboard is shown/hidden -->
      <resize-observer
        ref="chatContainerResizer"
        @notify="handleChatContainerResize"
      />

      <CreatedRoomWelcomeHeader
        v-if="showCreatedRoomWelcomeHeader"
        v-on:close="closeCreateRoomWelcomeHeader"
      />

      <div
        v-for="(event, index) in events"
        :key="event.getId()"
        :eventId="event.getId()"
      >
        <!-- DAY Marker, shown for every new day in the timeline -->
        <div
          v-if="showDayMarkerBeforeEvent(event)"
          class="day-marker"
          :title="dayForEvent(event)"
        />

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
              v-on:own-avatar-clicked="viewProfile"
              v-on:other-avatar-clicked="showAvatarMenuForEvent($event)"
              v-on:download="download(event)"
            />
            <!-- <div v-if="debugging" style="user-select:text">EventID: {{ event.getId() }}</div> -->
            <!-- <div v-if="debugging" style="user-select:text">Event: {{ JSON.stringify(event) }}</div> -->
            <div
              v-if="event.getId() == readMarker && index < events.length - 1"
              class="read-marker"
              :title="$t('message.unread_messages')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <v-container v-if="room" fluid class="input-area-outer">
      <!-- "Scroll to end"-button -->
      <v-btn
        class="scroll-to-end"
        v-show="showScrollToEnd"
        fab
        small
        elevation="0"
        color="black"
        @click.stop="scrollToEndOfTimeline"
      >
        <v-icon color="white">arrow_downward</v-icon>
      </v-btn>

      <v-row class="ma-0 pa-0">
        <div v-if="replyToEvent">
          {{
            $t("message.replying_to_event", {
              message: replyToEvent.getContent().body,
            })
          }}
        </div>

        <!-- CONTACT IS TYPING -->
        <div class="typing">
          {{ typingMembersString }}
        </div>
      </v-row>
      <v-row class="input-area-inner align-center">
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
            :placeholder="$t('message.your_message')"
            hide-details
            background-color="white"
            v-on:keydown.enter.prevent="
              () => {
                sendCurrentTextMessage();
              }
            "
          />
        </v-col>

        <v-col
          class="input-area-button text-center flex-grow-0 flex-shrink-1"
          v-if="editedEvent || replyToEvent"
        >
          <v-btn
            fab
            small
            elevation="0"
            color="black"
            @click.stop="cancelEditReply"
          >
            <v-icon color="white">cancel</v-icon>
          </v-btn>
        </v-col>

        <v-col
          class="input-area-button text-center flex-grow-0 flex-shrink-1"
          v-if="!currentInput || currentInput.length == 0 || showRecorder"
        >
          <v-btn
            v-if="canRecordAudio"
            class="mic-button"
            ref="mic_button"
            fab
            small
            elevation="0"
            v-blur
            style="z-index: 10"
            v-longTap:250="[showRecordingUI, startRecording]"
          >
            <v-icon :color="showRecorder ? 'white' : 'black'">mic</v-icon>
          </v-btn>
          <v-btn
            v-else
            class="mic-button"
            ref="mic_button"
            fab
            small
            elevation="0"
            v-blur
            style="z-index: 10"
            @click.stop="showNoRecordingAvailableDialog = true"
          >
            <v-icon :color="showRecorder ? 'white' : 'black'">mic</v-icon>
          </v-btn>
        </v-col>

        <v-col
          class="input-area-button text-center flex-grow-0 flex-shrink-1"
          v-else
        >
          <v-btn
            fab
            small
            elevation="0"
            color="black"
            @click.stop="sendCurrentTextMessage"
            :disabled="sendButtonDisabled"
          >
            <v-icon color="white">{{
              editedEvent ? "save" : "arrow_upward"
            }}</v-icon>
          </v-btn>
        </v-col>

        <v-col
          v-if="config.useShortCodeStickers"
          class="input-area-button text-center flex-grow-0 flex-shrink-1"
        >
          <v-btn
            v-if="!showRecorder"
            icon
            large
            color="black"
            @click="showStickerPicker"
            :disabled="attachButtonDisabled"
          >
            <v-icon large>face</v-icon>
          </v-btn>
        </v-col>

        <v-col class="input-area-button text-center flex-grow-0 flex-shrink-1">
          <label icon flat ref="attachmentLabel">
            <v-btn
              v-if="!showRecorder"
              icon
              large
              color="black"
              @click="showAttachmentPicker"
              :disabled="attachButtonDisabled"
            >
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
      </v-row>
      <VoiceRecorder
        :micButtonRef="$refs.mic_button"
        :ptt="showRecorderPTT"
        :show="showRecorder"
        v-on:close="showRecorder = false"
        v-on:file="onVoiceRecording"
      />
    </v-container>

    <div v-if="currentImageInputPath">
      <v-dialog
        v-model="currentImageInputPath"
        class="ma-0 pa-0"
        :width="$vuetify.breakpoint.smAndUp ? '50%' : '85%'"
      >
        <v-card class="ma-0 pa-0">
          <v-card-text class="ma-0 pa-2">
            <v-img
              v-if="currentImageInput && currentImageInput.image"
              :aspect-ratio="1"
              :src="currentImageInput.image"
              contain
              style="max-height: 50vh; background-color: #e2e2e2"
            />
            <div>
              file: {{ currentImageInputPath.name }}
              <span
                v-if="
                  currentImageInput &&
                  currentImageInput.scaled &&
                  currentImageInput.useScaled
                "
              >
                {{ currentImageInput.scaledDimensions.width }} x
                {{ currentImageInput.scaledDimensions.height }}</span
              >
              <span
                v-else-if="currentImageInput && currentImageInput.dimensions"
              >
                {{ currentImageInput.dimensions.width }} x
                {{ currentImageInput.dimensions.height }}</span
              >
              <span
                v-if="
                  currentImageInput &&
                  currentImageInput.scaled &&
                  currentImageInput.useScaled
                "
              >
                ({{ formatBytes(currentImageInput.scaledSize) }})</span
              >
              <span v-else>
                ({{ formatBytes(currentImageInputPath.size) }})</span
              >
              <v-switch
                v-if="currentImageInput && currentImageInput.scaled"
                :label="$t('message.scale_image')"
                v-model="currentImageInput.useScaled"
              />
            </div>
            <div v-if="currentSendError">{{ currentSendError }}</div>
            <div v-else>{{ currentSendProgress }}</div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="cancelSendAttachment">{{
              $t("menu.cancel")
            }}</v-btn>
            <v-btn
              color="primary"
              text
              @click="sendAttachment"
              v-if="currentSendShowSendButton"
              :disabled="currentSendOperation != null"
              >{{ $t("menu.send") }}</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <MessageOperationsBottomSheet ref="messageOperationsSheet">
      <MessageOperationsPicker
        v-on:close="showEmojiPicker = false"
        v-if="selectedEvent"
        v-on:addreaction="addReaction"
        v-on:addquickreaction="addQuickReaction"
        v-on:addreply="addReply(selectedEvent)"
        v-on:edit="edit(selectedEvent)"
        v-on:redact="redact(selectedEvent)"
        v-on:download="download(selectedEvent)"
        :event="selectedEvent"
      />
      <VEmojiPicker
        ref="emojiPicker"
        style="width: 100%"
        @select="emojiSelected"
      />
    </MessageOperationsBottomSheet>

    <StickerPickerBottomSheet
      ref="stickerPickerSheet"
      style="z-index: 10"
      v-on:selectSticker="sendSticker"
    />

    <!-- Loading indicator -->
    <v-container
      fluid
      fill-height
      style="position: absolute; background-color: rgba(0, 0, 0, 0.2)"
      v-if="!initialLoadDone || loading"
    >
      <v-row align="center" justify="center">
        <v-col class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-col>
      </v-row>
    </v-container>

    <RoomInfoBottomSheet ref="roomInfoSheet" />

    <!-- Dialog for audio recording not supported! -->
    <v-dialog
      v-model="showNoRecordingAvailableDialog"
      class="ma-0 pa-0"
      width="80%"
    >
      <v-card>
        <v-card-title>{{ $t("voice_recorder.not_supported_title") }}</v-card-title>
        <v-card-text>{{ $t("voice_recorder.not_supported_text") }}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="showNoRecordingAvailableDialog = false"
            >{{ $t("menu.ok") }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Vue from "vue";
import { TimelineWindow, EventTimeline } from "matrix-js-sdk";
import MessageIncomingText from "./messages/MessageIncomingText";
import MessageIncomingFile from "./messages/MessageIncomingFile";
import MessageIncomingImage from "./messages/MessageIncomingImage.vue";
import MessageIncomingAudio from "./messages/MessageIncomingAudio.vue";
import MessageIncomingVideo from "./messages/MessageIncomingVideo.vue";
import MessageIncomingSticker from "./messages/MessageIncomingSticker.vue";
import MessageOutgoingText from "./messages/MessageOutgoingText";
import MessageOutgoingFile from "./messages/MessageOutgoingFile";
import MessageOutgoingImage from "./messages/MessageOutgoingImage.vue";
import MessageOutgoingAudio from "./messages/MessageOutgoingAudio.vue";
import MessageOutgoingVideo from "./messages/MessageOutgoingVideo.vue";
import MessageOutgoingSticker from "./messages/MessageOutgoingSticker.vue";
import ContactJoin from "./messages/ContactJoin.vue";
import ContactLeave from "./messages/ContactLeave.vue";
import ContactInvited from "./messages/ContactInvited.vue";
import ContactChanged from "./messages/ContactChanged.vue";
import RoomCreated from "./messages/RoomCreated.vue";
import RoomAliased from "./messages/RoomAliased.vue";
import RoomNameChanged from "./messages/RoomNameChanged.vue";
import RoomTopicChanged from "./messages/RoomTopicChanged.vue";
import RoomAvatarChanged from "./messages/RoomAvatarChanged.vue";
import RoomHistoryVisibility from "./messages/RoomHistoryVisibility.vue";
import RoomJoinRules from "./messages/RoomJoinRules.vue";
import RoomPowerLevelsChanged from "./messages/RoomPowerLevelsChanged.vue";
import RoomGuestAccessChanged from "./messages/RoomGuestAccessChanged.vue";
import RoomEncrypted from "./messages/RoomEncrypted.vue";
import DebugEvent from "./messages/DebugEvent.vue";
import util from "../plugins/utils";
import MessageOperations from "./messages/MessageOperations.vue";
import MessageOperationsPicker from "./messages/MessageOperationsPicker.vue";
import AvatarOperations from "./messages/AvatarOperations.vue";
import ChatHeader from "./ChatHeader";
import VoiceRecorder from "./VoiceRecorder";
import RoomInfoBottomSheet from "./RoomInfoBottomSheet";
import CreatedRoomWelcomeHeader from "./CreatedRoomWelcomeHeader";
import MessageOperationsBottomSheet from "./MessageOperationsBottomSheet";
import stickers from "../plugins/stickers";
import StickerPickerBottomSheet from "./StickerPickerBottomSheet";
import BottomSheet from "./BottomSheet.vue";
import config from "../assets/config";
import ImageResize from "image-resize";
const sizeOf = require("image-size");
const dataUriToBuffer = require("data-uri-to-buffer");
const prettyBytes = require("pretty-bytes");

const READ_RECEIPT_TIMEOUT = 5000; /* How long a message must have been visible before the read marker is updated */
const WINDOW_BUFFER_SIZE = 0.3; /** Relative window height of when we start paginating. Always keep this much loaded before and after our scroll position!  */

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
    MessageIncomingFile,
    MessageIncomingImage,
    MessageIncomingAudio,
    MessageIncomingVideo,
    MessageIncomingSticker,
    MessageOutgoingText,
    MessageOutgoingFile,
    MessageOutgoingImage,
    MessageOutgoingAudio,
    MessageOutgoingVideo,
    MessageOutgoingSticker,
    ContactJoin,
    ContactLeave,
    ContactInvited,
    ContactChanged,
    RoomCreated,
    RoomAliased,
    RoomNameChanged,
    RoomTopicChanged,
    RoomAvatarChanged,
    RoomHistoryVisibility,
    RoomJoinRules,
    RoomPowerLevelsChanged,
    RoomGuestAccessChanged,
    RoomEncrypted,
    DebugEvent,
    MessageOperations,
    MessageOperationsPicker,
    VoiceRecorder,
    RoomInfoBottomSheet,
    CreatedRoomWelcomeHeader,
    MessageOperationsBottomSheet,
    StickerPickerBottomSheet,
    BottomSheet,
    AvatarOperations,
  },

  data() {
    return {
      config: config,
      events: [],
      currentInput: "",
      typingMembers: [],
      timelineWindow: null,

      /** true if we are currently paginating */
      timelineWindowPaginating: false,

      scrollPosition: null,
      currentImageInput: null,
      currentImageInputPath: null,
      currentSendOperation: null,
      currentSendProgress: null,
      currentSendShowSendButton: true,
      currentSendError: null,
      showEmojiPicker: false,
      selectedEvent: null,
      editedEvent: null,
      replyToEvent: null,
      showNoRecordingAvailableDialog: false,
      showContextMenu: false,
      showContextMenuAnchor: null,
      showAvatarMenu: false,
      showAvatarMenuAnchor: null,
      initialLoadDone: false,
      loading: false, // Set this to true during long operations to show a "spinner" overlay
      showRecorder: false,
      showRecorderPTT: false, // True to open the voice recorder in push-to-talk mode.

      /**
       * Current chat container size. We need to keep track of this so that if and when
       * a soft keyboard is shown/hidden we can restore the scroll position correctly.
       * If we don't, the keyboard will simply overflow the message we are answering to etc.
       */
      chatContainerSize: 0,

      /**
       * True if we should show the "scroll to end" marker in the chat. For now at least, we use a simple
       * method here, basically just "if we can scroll, show it".
       */
      showScrollToEnd: false,

      /** A timer for read receipts. */
      rrTimer: null,

      /** Last event we sent a Read Receipt/Read Marker for */
      lastRR: null,

      /** If we just created this room, show a small welcome header with info */
      showCreatedRoomWelcomeHeader: false,

      /** An array of recent emojis. Used in the "message operations" popup. */
      recentEmojis: [],
    };
  },

  mounted() {
    const container = this.$refs.chatContainer;
    this.scrollPosition = new ScrollPosition(container);
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
      if (!this.$matrix.ready && this.currentUser) {
        // If we have a user already, wait for ready state. If not, we
        // dont want to return here, because we want to redirect to "join".
        return null; // Not ready yet...
      }
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
      return (
        this.fullyReadMarker ||
        this.room.getEventReadUpTo(this.$matrix.currentUserId, false)
      );
    },
    fullyReadMarker() {
      const readEvent = this.room.getAccountData("m.fully_read");
      if (readEvent) {
        return readEvent.getContent().event_id;
      }
      return null;
    },
    attachButtonDisabled() {
      return (
        this.editedEvent != null ||
        this.replyToEvent != null ||
        this.currentInput.length > 0
      );
    },
    sendButtonDisabled() {
      return this.currentInput.length == 0;
    },
    typingMembersString() {
      const count = this.typingMembers.length;
      if (count > 1) {
        return this.$t("message.users_are_typing", { count: count });
      } else if (count > 0) {
        return this.$t("message.user_is_typing", {
          user: this.typingMembers[0].name,
        });
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
          if (left + 250 > rectChat.right) {
            left = rectChat.right - 250; // Pretty ugly, but we want to make sure it does not escape the screen, and we don't have the exakt width of it (yet)!
          }
        }
      }
      return "top:" + top + "px;left:" + left + "px";
    },
    avatarOpStyle() {
      // Calculate where to show the context menu.
      //
      const ref = this.selectedEvent && this.$refs[this.selectedEvent.getId()];
      var top = 0;
      var left = 0;
      if (ref && ref[0]) {
        if (this.showAvatarMenuAnchor) {
          var rectAnchor = this.showAvatarMenuAnchor.getBoundingClientRect();
          var rectChat = this.$refs.avatarOperationsStrut.getBoundingClientRect();
          top = rectAnchor.top - rectChat.top;
          left = rectAnchor.left - rectChat.left;
          // if (left + 250 > rectChat.right) {
          //   left = rectChat.right - 250; // Pretty ugly, but we want to make sure it does not escape the screen, and we don't have the exakt width of it (yet)!
          // }
        }
      }
      return "top:" + top + "px;left:" + left + "px";
    },
    canRecordAudio() {
      return util.browserCanRecordAudio();
    },
    debugging() {
      return (window.location.host || "").startsWith("localhost");
    },
  },

  watch: {
    roomId: {
      immediate: true,
      handler(value, oldValue) {
        if (value && value == oldValue) {
          return; // No change.
        }
        console.log(
          "Chat: Current room changed to " + (value ? value : "null")
        );

        // Clear old events
        this.$matrix.off("Room.timeline", this.onEvent);
        this.$matrix.off("RoomMember.typing", this.onUserTyping);

        this.events = [];
        this.timelineWindow = null;
        this.typingMembers = [];
        this.initialLoadDone = false;

        // Stop RR timer
        this.stopRRTimer();
        this.lastRR = null;

        if (!this.room) {
          // Public room?
          if (this.roomId && this.roomId.startsWith("#")) {
            this.onRoomNotJoined();
          } else if (this.roomId) {
            this.onRoomNotJoined(); // Private room we are not joined to. What to do? We redirect to join
            // screen, maybe the user has an invite already?
          }
          this.initialLoadDone = true;
          return; // no room
        }

        // Joined?
        if (this.room.hasMembershipState(this.currentUser.user_id, "join")) {
          // Yes, load everything
          this.onRoomJoined(this.readMarker);
        } else {
          this.onRoomNotJoined();
        }
      },
    },
  },

  methods: {
    onRoomJoined(initialEventId) {
      // Was this room just created (by you)? Show a small info header in
      // that case!
      const createEvent = this.room.currentState.getStateEvents(
        "m.room.create",
        ""
      );
      if (createEvent) {
        const creatorId = createEvent.getContent().creator;
        if (
          creatorId == this.$matrix.currentUserId &&
          createEvent.getLocalAge() < 5 * 60000 /* 5 minutes */
        ) {
          this.showCreatedRoomWelcomeHeader = true;
        }
      }

      // Listen to events
      this.$matrix.on("Room.timeline", this.onEvent);
      this.$matrix.on("RoomMember.typing", this.onUserTyping);

      console.log("Read up to " + initialEventId);

      //initialEventId = null;

      this.timelineWindow = new TimelineWindow(
        this.$matrix.matrixClient,
        this.room.getUnfilteredTimelineSet(),
        {}
      );
      const self = this;
      this.timelineWindow
        .load(initialEventId, 20)
        .then(() => {
          self.events = self.timelineWindow.getEvents();

          const getMoreIfNeeded = function _getMoreIfNeeded() {
            const container = self.$refs.chatContainer;
            if (
              container.scrollHeight <=
                (1 + 2 * WINDOW_BUFFER_SIZE) * container.clientHeight &&
              self.timelineWindow &&
              self.timelineWindow.canPaginate(EventTimeline.BACKWARDS)
            ) {
              return self.timelineWindow
                .paginate(EventTimeline.BACKWARDS, 10, true, 5)
                .then((success) => {
                  self.events = self.timelineWindow.getEvents();
                  if (success) {
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
            .catch((err) => {
              console.log("ERROR " + err);
            })
            .finally(() => {
              self.initialLoadDone = true;
              if (initialEventId && !this.showCreatedRoomWelcomeHeader) {
                self.scrollToEvent(initialEventId);
              } else if (this.showCreatedRoomWelcomeHeader) {
                self.onScroll();
              }
              self.restartRRTimer();
            });
        })
        .catch((err) => {
          console.log("Error fetching events!", err, this);
          if (err.errcode == "M_UNKNOWN" && initialEventId) {
            // Try again without initial event!
            this.onRoomJoined(null);
          } else {
            // Error. Done loading.
            this.events = this.timelineWindow.getEvents();
            this.initialLoadDone = true;
          }
        });
    },

    onRoomNotJoined() {
      this.$navigation.push(
        {
          name: "Join",
          params: { roomId: util.sanitizeRoomId(this.roomAliasOrId) },
        },
        0
      );
    },

    scrollToEndOfTimeline() {
      if (
        this.timelineWindow &&
        this.timelineWindow.canPaginate(EventTimeline.FORWARDS)
      ) {
        this.loading = true;
        // Instead of paging though ALL history, just reload a timeline at the live marker...
        var timelineWindow = new TimelineWindow(
          this.$matrix.matrixClient,
          this.room.getUnfilteredTimelineSet(),
          {}
        );
        const self = this;
        timelineWindow
          .load(null, 20)
          .then(() => {
            self.timelineWindow = timelineWindow;
            self.events = self.timelineWindow.getEvents();
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        // Can't paginate, just scroll to bottom of window!
        this.smoothScrollToEnd();
      }
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
     * Triggered when our "long tap" timer hits.
     */
    touchTimerElapsed() {
      this.updateRecentEmojis();
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
            if (
              event.getPrevContent() &&
              event.getPrevContent().membership == "join"
            ) {
              // We we already joined, so this must be a display name and/or avatar update!
              return ContactChanged;
            } else {
              return ContactJoin;
            }
          } else if (event.getContent().membership == "leave") {
            return ContactLeave;
          } else if (event.getContent().membership == "invite") {
            return ContactInvited;
          }
          break;

        case "m.room.message":
          if (event.getSender() != this.$matrix.currentUserId) {
            if (event.getContent().msgtype == "m.image") {
              // For SVG, make downloadable
              if (
                event.getContent().info &&
                event.getContent().info.mimetype &&
                event.getContent().info.mimetype.startsWith("image/svg")
              ) {
                return MessageIncomingFile;
              }
              return MessageIncomingImage;
            } else if (event.getContent().msgtype == "m.audio") {
              return MessageIncomingAudio;
            } else if (event.getContent().msgtype == "m.video") {
              return MessageIncomingVideo;
            } else if (event.getContent().msgtype == "m.file") {
              return MessageIncomingFile;
            } else if (stickers.isStickerShortcode(event.getContent().body)) {
              return MessageIncomingSticker;
            }
            return MessageIncomingText;
          } else {
            if (event.getContent().msgtype == "m.image") {
              // For SVG, make downloadable
              if (
                event.getContent().info &&
                event.getContent().info.mimetype &&
                event.getContent().info.mimetype.startsWith("image/svg")
              ) {
                return MessageOutgoingImage;
              }
              return MessageOutgoingImage;
            } else if (event.getContent().msgtype == "m.audio") {
              return MessageOutgoingAudio;
            } else if (event.getContent().msgtype == "m.video") {
              return MessageOutgoingVideo;
            } else if (event.getContent().msgtype == "m.file") {
              return MessageOutgoingFile;
            } else if (stickers.isStickerShortcode(event.getContent().body)) {
              return MessageOutgoingSticker;
            }
            return MessageOutgoingText;
          }

        case "m.room.create":
          return RoomCreated;

        case "m.room.canonical_alias":
          return RoomAliased;

        case "m.room.name":
          return RoomNameChanged;

        case "m.room.topic":
          return RoomTopicChanged;

        case "m.room.avatar":
          return RoomAvatarChanged;

        case "m.room.history_visibility":
          return RoomHistoryVisibility;

        case "m.room.join_rules":
          return RoomJoinRules;

        case "m.room.power_levels":
          return RoomPowerLevelsChanged;

        case "m.room.guest_access":
          return RoomGuestAccessChanged;

        case "m.room.encryption":
          return RoomEncrypted;
      }
      return this.debugging ? DebugEvent : null;
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
      const bufferHeight = container.clientHeight * WINDOW_BUFFER_SIZE;
      if (container.scrollTop <= bufferHeight) {
        // Scrolled to top
        this.handleScrolledToTop();
      } else if (
        container.scrollHeight -
          container.scrollTop.toFixed(0) -
          container.clientHeight <=
        bufferHeight
      ) {
        this.handleScrolledToBottom(false);
      }
      this.showScrollToEnd =
        container.scrollHeight - container.scrollTop.toFixed(0) >
          container.clientHeight ||
        (this.timelineWindow &&
          this.timelineWindow.canPaginate(EventTimeline.FORWARDS));

      this.restartRRTimer();
    },
    onEvent(event) {
      //console.log("OnEvent", JSON.stringify(event));
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
      //console.log("Typing: ", this.typingMembers);
    },

    sendCurrentTextMessage() {
      // DOn't have "enter" send messages while in recorder.
      if (this.currentInput.length > 0 && !this.showRecorder) {
        this.sendMessage(this.currentInput);
        this.currentInput = "";
        this.editedEvent = null; //TODO - Is this a good place to reset this?
        this.replyToEvent = null;
      }
    },

    sendMessage(text) {
      if (text && text.length > 0) {
        util
          .sendTextMessage(
            this.$matrix.matrixClient,
            this.roomId,
            text,
            this.editedEvent,
            this.replyToEvent
          )
          .then(() => {
            console.log("Sent message");
          })
          .catch((err) => {
            console.log("Failed to send:", err);
          });
      }
    },

    /**
     * Show attachment picker to select file
     */
    showAttachmentPicker() {
      this.$refs.attachment.click();
    },

    /**
     * Handle picked attachment
     */
    handlePickedAttachment(event) {
      if (event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
          const file = event.target.files[0];
          this.currentSendShowSendButton = true;
          if (file.type.startsWith("image/")) {
            this.currentImageInput = {
              image: e.target.result,
              dimensions: null,
            };
            try {
              this.currentImageInput.dimensions = sizeOf(
                dataUriToBuffer(e.target.result)
              );

              // Need to resize?
              const w = this.currentImageInput.dimensions.width;
              const h = this.currentImageInput.dimensions.height;
              if (w > 640 || h > 640) {
                var aspect = w / h;
                var newWidth = parseInt((w > h ? 640 : 640 * aspect).toFixed());
                var newHeight = parseInt(
                  (w > h ? 640 / aspect : 640).toFixed()
                );
                var imageResize = new ImageResize({
                  format: "png",
                  width: newWidth,
                  height: newHeight,
                  outputType: "blob",
                });
                imageResize
                  .play(event.target)
                  .then((img) => {
                    Vue.set(
                      this.currentImageInput,
                      "scaled",
                      new File([img], file.name, {
                        type: img.type,
                        lastModified: Date.now(),
                      })
                    );
                    Vue.set(this.currentImageInput, "useScaled", true);
                    Vue.set(this.currentImageInput, "scaledSize", img.size);
                    Vue.set(this.currentImageInput, "scaledDimensions", {
                      width: newWidth,
                      height: newHeight,
                    });
                  })
                  .catch((err) => {
                    console.error("Resize failed:", err);
                  });
              }
            } catch (error) {
              console.error("Failed to get image dimensions: " + error);
            }
          }
          console.log(this.currentImageInput);
          this.currentImageInputPath = file;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    },

    showStickerPicker() {
      this.$refs.stickerPickerSheet.open();
    },

    onUploadProgress(p) {
      if (p.total) {
        this.currentSendProgress = this.$t(
          "message.upload_progress_with_total",
          { count: p.loaded || 0, total: p.total }
        );
      } else {
        this.currentSendProgress = this.$t("message.upload_progress", {
          count: p.loaded || 0,
        });
      }
    },

    sendAttachment(withText) {
      this.$refs.attachment.value = null;
      if (this.currentImageInputPath) {
        var inputFile = this.currentImageInputPath;
        if (
          this.currentImageInput &&
          this.currentImageInput.scaled &&
          this.currentImageInput.useScaled
        ) {
          // Send scaled version of image instead!
          inputFile = this.currentImageInput.scaled;
        }
        this.currentSendProgress = null;
        this.currentSendOperation = util.sendImage(
          this.$matrix.matrixClient,
          this.roomId,
          inputFile,
          this.onUploadProgress
        );
        this.currentSendOperation
          .then(() => {
            this.currentSendOperation = null;
            this.currentImageInput = null;
            this.currentImageInputPath = null;
            this.currentSendProgress = null;
            if (withText) {
              this.sendMessage(withText);
            }
          })
          .catch((err) => {
            this.currentSendError = err.toLocaleString();
            this.currentSendOperation = null;
            this.currentSendProgress = null;
          });
      }
    },

    cancelSendAttachment() {
      this.$refs.attachment.value = null;
      if (this.currentSendOperation) {
        this.currentSendOperation.reject("Canceled");
      }
      this.currentSendOperation = null;
      this.currentImageInput = null;
      this.currentImageInputPath = null;
      this.currentSendProgress = null;
      this.currentSendError = null;
    },

    handleScrolledToTop() {
      console.log("@top");
      if (
        this.timelineWindow &&
        this.timelineWindow.canPaginate(EventTimeline.BACKWARDS) &&
        !this.timelineWindowPaginating
      ) {
        this.timelineWindowPaginating = true;
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
          })
          .finally(() => {
            this.timelineWindowPaginating = false;
          });
      }
    },

    handleScrolledToBottom(scrollToEnd) {
      console.log("@bottom");
      if (
        this.timelineWindow &&
        this.timelineWindow.canPaginate(EventTimeline.FORWARDS) &&
        !this.timelineWindowPaginating
      ) {
        this.timelineWindowPaginating = true;
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
          })
          .finally(() => {
            this.timelineWindowPaginating = false;
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

    showMoreMessageOperations(e) {
      this.addReaction(e);
    },

    addReaction(e) {
      const event = e.event;
      // Store the event we are reacting to, so that we know where to
      // send when the picker closes.
      this.selectedEvent = event;
      this.$refs.messageOperationsSheet.open();
      this.showEmojiPicker = true;
    },

    addQuickReaction(e) {
      this.sendQuickReaction({ reaction: e.emoji, event: e.event });
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
      this.$matrix.matrixClient
        .redactEvent(event.getRoomId(), event.getId())
        .then(() => {
          console.log("Message redacted");
        })
        .catch((err) => {
          console.log("Redaction failed: ", err);
        });
    },

    download(event) {
      util
        .getAttachment(this.$matrix.matrixClient, event)
        .then((url) => {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.download =
            event.getContent().body || this.$t("fallbacks.download_name");
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

    sendSticker(stickerShortCode) {
      this.sendMessage(stickerShortCode);
    },

    showContextMenuForEvent(e) {
      const event = e.event;
      this.selectedEvent = event;
      this.updateRecentEmojis();
      this.showContextMenu = true;
      this.showContextMenuAnchor = e.anchor;
    },

    showAvatarMenuForEvent(e) {
      const event = e.event;
      this.selectedEvent = event;
      this.showAvatarMenu = true;
      this.showAvatarMenuAnchor = e.anchor;
    },

    viewProfile() {
      this.$navigation.push({ name: "Profile" }, 1);
    },

    startPrivateChat(e) {
      this.$matrix
        .getOrCreatePrivateChat(e.event.getSender())
        .then((room) => {
          this.$nextTick(() => {
            this.$navigation.push(
              {
                name: "Chat",
                params: {
                  roomId: util.sanitizeRoomId(
                    room.getCanonicalAlias() || room.roomId
                  ),
                },
              },
              -1
            );
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },

    closeContextMenusIfOpen(e) {
      if (this.showContextMenu) {
        this.showContextMenu = false;
        this.showContextMenuAnchor = null;
        e.preventDefault();
      }
      if (this.showAvatarMenu) {
        this.showAvatarMenu = false;
        this.showAvatarMenuAnchor = null;
        e.preventDefault();
      }
    },

    /** Stop Read Receipt timer */
    stopRRTimer() {
      if (this.rrTimer) {
        clearTimeout(this.rrTimer);
        this.rrTimer = null;
      }
    },

    /**
     * Start/restart the timer to Read Receipts.
     */
    restartRRTimer() {
      this.stopRRTimer();
      this.rrTimer = setTimeout(this.rrTimerElapsed, READ_RECEIPT_TIMEOUT);
    },

    rrTimerElapsed() {
      this.rrTimer = null;

      const container = this.$refs.chatContainer;
      const elFirst = util.getFirstVisibleElement(container);
      const elLast = util.getLastVisibleElement(container);
      if (elFirst && elLast) {
        const eventIdFirst = elFirst.getAttribute("eventId");
        const eventIdLast = elLast.getAttribute("eventId");
        if (eventIdLast && this.room) {
          var event = this.room.findEventById(eventIdLast);
          const index = this.events.indexOf(event);

          // Walk backwards through visible events to the first one that is incoming
          //
          var lastTimestamp = 0;
          if (this.lastRR) {
            lastTimestamp = this.lastRR.getTs();
          }

          for (var i = index; i >= 0; i--) {
            event = this.events[i];
            if (event == this.lastRR || event.getTs() <= lastTimestamp) {
              // Already sent this or too old...
              break;
            }
            // Make sure it's not a local echo event...
            if (!event.getId().startsWith("~")) {
              // Send read receipt
              this.$matrix.matrixClient
                .sendReadReceipt(event)
                .then(() => {
                  this.$matrix.matrixClient.setRoomReadMarkers(
                    this.room.roomId,
                    event.getId()
                  );
                })
                .then(() => {
                  console.log("RR sent for event: " + event.getId());
                  this.lastRR = event;
                })
                .catch((err) => {
                  console.log("Failed to update read marker: ", err);
                })
                .finally(() => {
                  this.restartRRTimer();
                });
              return; // Bail out here
            }

            // Stop iterating at first visible
            if (event.getId() == eventIdFirst) {
              break;
            }
          }
        }
      }
      this.restartRRTimer();
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
    },

    showRecordingUI() {
      this.showRecorderPTT = false;
      this.showRecorder = true;
    },

    startRecording() {
      this.showRecorderPTT = true;
      this.showRecorder = true;
    },

    onVoiceRecording(event) {
      this.currentSendShowSendButton = false;
      this.currentImageInputPath = event.file;
      var text = undefined;
      if (this.currentInput && this.currentInput.length > 0) {
        text = this.currentInput;
        this.currentInput = "";
      }
      this.sendAttachment(text);
      this.showRecorder = false;

      // Log event to Clean Insights
      this.$ci.event("Audio", "Voice message sent");
    },

    closeCreateRoomWelcomeHeader() {
      this.showCreatedRoomWelcomeHeader = false;
      this.$nextTick(() => {
        // We change the layout when removing the welcome header, so call
        // onScroll here to handle updates (e.g. remove the "scroll to last" if we now
        // can see all messages).
        this.onScroll();
      });
    },

    updateRecentEmojis() {
      if (this.$refs.emojiPicker) {
        this.recentEmojis = this.$refs.emojiPicker.mapEmojis["Frequently"];
        return;
      }
      this.recentEmojis = [];
    },

    formatBytes(bytes) {
      return prettyBytes(bytes);
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/css/chat.scss";
</style>