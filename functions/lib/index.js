"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upcomingMeetingReminder = exports.onConsensusReached = exports.onMeetingCreated = void 0;
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
// Use Expo's SDK for sending notifications
const expo_server_sdk_1 = require("expo-server-sdk");
admin.initializeApp();
const db = admin.firestore();
const expo = new expo_server_sdk_1.default(); // Create a new Expo client
// Helper function to get EXPO push tokens for a list of user IDs
async function getTokens(userIds) {
    const tokens = [];
    // Use Promise.all for faster parallel lookups
    await Promise.all(userIds.map(async (userId) => {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Ensure the token is a valid ExpoPushToken
            if (userData?.pushTokens && Array.isArray(userData.pushTokens)) {
                userData.pushTokens.forEach((token) => {
                    if (expo_server_sdk_1.default.isExpoPushToken(token)) {
                        tokens.push(token);
                    }
                });
            }
        }
    }));
    return tokens;
}
/**
 * 1. Notify members when a new meeting has been created.
 */
exports.onMeetingCreated = (0, firestore_1.onDocumentCreated)("groups/{groupId}/meetings/{meetingId}", async (event) => {
    const meetingData = event.data?.data();
    if (!meetingData) {
        logger.error("No data associated with the event");
        return;
    }
    const groupId = event.params.groupId;
    const meetingId = event.params.meetingId;
    const groupDoc = await db.collection("groups").doc(groupId).get();
    const groupData = groupDoc.data();
    if (!groupData) {
        logger.error(`Group ${groupId} not found`);
        return;
    }
    const members = groupData.members || [];
    const tokens = await getTokens(members);
    if (tokens.length > 0) {
        logger.log(`Sending new meeting notification to ${tokens.length} tokens.`);
        await expo.sendPushNotificationsAsync([
            {
                to: tokens,
                sound: "default",
                title: `New Meeting in ${groupData.name}!`,
                body: `A new meeting, "${meetingData.name}", has been created. Tap to view.`,
                data: { groupId, meetingId }, // This is the deep-link data
            },
        ]);
    }
});
/**
 * 2. Notify members when a consensus is reached (final recommendations ready)
 */
exports.onConsensusReached = (0, firestore_1.onDocumentUpdated)("groups/{groupId}/meetings/{meetingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();
    if (!newData || !oldData) {
        logger.error("Event data is missing");
        return;
    }
    // Trigger only when finalRecommendations field is newly added
    if (newData.finalRecommendations && !oldData.finalRecommendations) {
        const groupId = event.params.groupId;
        const meetingId = event.params.meetingId;
        const groupDoc = await db.collection("groups").doc(groupId).get();
        const groupData = groupDoc.data();
        if (!groupData) {
            logger.error(`Group ${groupId} not found`);
            return;
        }
        const members = groupData.members || [];
        const tokens = await getTokens(members);
        if (tokens.length > 0) {
            logger.log(`Sending consensus notification to ${tokens.length} tokens.`);
            await expo.sendPushNotificationsAsync([
                {
                    to: tokens,
                    sound: "default",
                    title: `Time to Decide for "${newData.name}"!`,
                    body: "The top restaurant choices are ready. Tap to vote now!",
                    data: { groupId, meetingId },
                },
            ]);
        }
    }
});
/**
 * 3. Remind members of an upcoming meeting (Scheduled Function).
 * Runs once a day. Make sure to enable the Cloud Scheduler API in your Google Cloud project.
 */
exports.upcomingMeetingReminder = (0, scheduler_1.onSchedule)("every 24 hours", async (event) => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const groupsSnapshot = await db.collection("groups").get();
    for (const groupDoc of groupsSnapshot.docs) {
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();
        const members = groupData.members || [];
        // Find meetings happening in the next 24 hours
        const meetingsQuery = db.collection("groups").doc(groupId).collection("meetings")
            .where("date", ">=", now)
            .where("date", "<=", in24Hours);
        const meetingsSnapshot = await meetingsQuery.get();
        if (!meetingsSnapshot.empty) {
            const tokens = await getTokens(members);
            if (tokens.length > 0) {
                for (const meetingDoc of meetingsSnapshot.docs) {
                    const meetingData = meetingDoc.data();
                    logger.log(`Sending reminder for meeting ${meetingDoc.id} to ${tokens.length} tokens.`);
                    await expo.sendPushNotificationsAsync([{
                            to: tokens,
                            sound: "default",
                            title: `Reminder: "${meetingData.name}" is tomorrow!`,
                            body: `Your meeting with ${groupData.name} is happening soon.`,
                            data: { groupId, meetingId: meetingDoc.id },
                        }]);
                }
            }
        }
    }
});
//# sourceMappingURL=index.js.map