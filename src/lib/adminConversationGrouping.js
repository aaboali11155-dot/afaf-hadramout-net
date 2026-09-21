/**
 * Problem 04 — Unified admin conversation grouping.
 *
 * Groups contact requests + messages by an unordered user pair.
 * No visual/CSS changes are required: the existing card component can
 * consume the returned `conversations` array.
 */

const asTime = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

export const getConversationPairKey = (a, b) => {
  if (!a || !b || a === b) return null;
  return [String(a), String(b)].sort().join(':');
};

export const groupAdminInteractionsByPair = ({
  contactRequests = [],
  messages = [],
  getUserId = (row) =>
    row?.user_id ??
    row?.sender_user_id ??
    row?.sender_id ??
    row?.receiver_user_id ??
    row?.receiver_id,
} = {}) => {
  const map = new Map();

  const ensure = (a, b, row) => {
    const key = getConversationPairKey(a, b);
    if (!key) return null;

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        pairKey: key,
        userIds: [String(a), String(b)],
        interactions: [],
        latestInteractionAt: null,
        latestInteraction: null,
        contactRequestCount: 0,
        messageCount: 0,
      });
    }
    return map.get(key);
  };

  contactRequests.forEach((request) => {
    const a = request.sender_user_id ?? request.sender_id;
    const b = request.receiver_user_id ?? request.receiver_id;
    const conversation = ensure(a, b, request);
    if (!conversation) return;

    const at =
      request.created_at ??
      request.updated_at ??
      request.reviewed_at ??
      request.sent_at;

    conversation.interactions.push({
      id: `contact-request:${request.id}`,
      type: 'contact_request',
      at,
      timestamp: asTime(at),
      data: request,
    });
    conversation.contactRequestCount += 1;
  });

  messages.forEach((message) => {
    const a = message.sender_user_id ?? message.sender_id;
    const b = message.receiver_user_id ?? message.receiver_id;
    const conversation = ensure(a, b, message);
    if (!conversation) return;

    const at = message.created_at ?? message.sent_at ?? message.updated_at;

    conversation.interactions.push({
      id: `message:${message.id}`,
      type: 'message',
      at,
      timestamp: asTime(at),
      data: message,
    });
    conversation.messageCount += 1;
  });

  return [...map.values()]
    .map((conversation) => {
      conversation.interactions.sort((x, y) => x.timestamp - y.timestamp);
      conversation.latestInteraction =
        conversation.interactions[conversation.interactions.length - 1] ?? null;
      conversation.latestInteractionAt =
        conversation.latestInteraction?.at ?? null;
      return conversation;
    })
    .sort(
      (a, b) =>
        asTime(b.latestInteractionAt) - asTime(a.latestInteractionAt)
    );
};
