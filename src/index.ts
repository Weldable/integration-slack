import { defineIntegration, createRestHandler, IntegrationApiError } from '@weldable/integration-core'

// Slack returns HTTP 200 for all responses — the `ok` field is the real indicator
const rest = createRestHandler({
  checkError: (response) => {
    const data = response.data as Record<string, unknown> | null
    if (data && data['ok'] === false) {
      const msg = data['error'] ?? 'Slack API error'
      throw new IntegrationApiError(String(msg), response.status, response.data)
    }
  },
})

export default defineIntegration({
  id: 'slack',
  version: 1,
  name: 'Slack',
  description: 'Send messages and interact with Slack workspaces.',
  icon: 'slack',
  exampleUsage: "Post a summary of today's standup notes to #engineering",
  auth: {
    type: 'oauth2',
    test: rest({ method: 'GET', path: '/auth.test' }),
  },
  baseUrl: 'https://slack.com/api',
  headers: { 'Content-Type': 'application/json' },
  nangoProvider: 'slack',
  nangoScopes: 'chat:write,chat:write.public,channels:read,channels:history,groups:history,channels:manage,channels:write.invites,channels:write.topic,groups:write.topic,channels:join,reactions:write,reactions:read,users:read,users:read.email',
  nangoCredentialEnvPrefix: 'SLACK',
  actions: [
    // ── Messages ─────────────────────────────────────────────
    {
      actionId: 'post_message',
      name: 'Send message',
      description: 'Send (post) a message to a Slack channel.',
      intents: [
        'notify my team',
        'send a message to the channel',
        'tell everyone in engineering',
        'announce in slack',
        'ping the team',
        'drop a note in slack',
        'message the channel',
        'post to a channel',
        'post something to slack',
        'share an update in the channel',
      ],
      preview: '#{channel}: {text}',
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID or name to post to.' },
        { name: 'text', type: 'text', required: true, description: 'Message text (supports Slack mrkdwn formatting).' },
      ],
      outputFields: [
        { name: 'ts', type: 'string', description: 'Timestamp identifier of the posted message.' },
        { name: 'channel', type: 'string', description: 'Channel ID the message was posted to.' },
      ],
      execute: rest({ method: 'POST', path: '/chat.postMessage', paramMapping: { channel: 'body', text: 'body' } }),
    },
    {
      actionId: 'reply_to_thread',
      name: 'Reply to thread',
      description: 'Reply to a specific message thread in a Slack channel.',
      intents: [
        'reply to a slack thread',
        'respond to a message thread',
        'follow up in a thread',
        'continue a thread',
        'add to a conversation thread',
        'comment on a slack thread',
        'chime in on a thread',
      ],
      preview: '#{channel} thread: {text}',
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the thread.' },
        { name: 'text', type: 'text', required: true, description: 'Reply text (supports Slack mrkdwn formatting).' },
        { name: 'thread_ts', type: 'string', required: true, description: 'Timestamp of the parent message to reply to.' },
      ],
      outputFields: [
        { name: 'ts', type: 'string', description: 'Timestamp of the reply message, usable as a thread reference.' },
        { name: 'channel', type: 'string', description: 'Channel ID the reply was posted to.' },
        { name: 'message', type: 'object', description: 'Full message object including text, user, and ts.' },
      ],
      execute: rest({ method: 'POST', path: '/chat.postMessage', paramMapping: { channel: 'body', text: 'body', thread_ts: 'body' } }),
    },
    {
      actionId: 'update_message',
      name: 'Update message',
      description: 'Edit a message in a Slack channel.',
      intents: [
        'edit a slack message',
        'change what I posted',
        'fix a message in slack',
        'correct a slack post',
        'revise a message I sent',
        'update a slack post',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the message.' },
        { name: 'message_timestamp', type: 'string', required: true, description: 'Timestamp of the message to update.' },
        { name: 'text', type: 'text', required: false, description: 'New message text.' },
        { name: 'blocks', type: 'object', required: false, description: 'Array of Block Kit block objects.' },
      ],
      outputFields: [
        { name: 'ts', type: 'string', description: 'Timestamp of the updated message.' },
        { name: 'channel', type: 'string', description: 'Channel ID containing the updated message.' },
        { name: 'text', type: 'string', description: 'Updated message text.' },
      ],
      execute: rest({ method: 'POST', path: '/chat.update', paramMapping: { channel: 'body', message_timestamp: 'body', text: 'body', blocks: 'body' } }),
    },
    {
      actionId: 'delete_message',
      name: 'Delete message',
      description: 'Delete a message from a Slack channel.',
      intents: [
        'remove a slack message',
        'take down a post',
        'delete what was sent to slack',
        'erase a slack message',
        'get rid of a message in slack',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the message.' },
        { name: 'message_timestamp', type: 'string', required: true, description: 'Timestamp of the message to delete.' },
      ],
      outputFields: [
        { name: 'channel', type: 'string', description: 'Channel ID from which the message was deleted.' },
        { name: 'ts', type: 'string', description: 'Timestamp of the deleted message.' },
      ],
      execute: rest({ method: 'POST', path: '/chat.delete', paramMapping: { channel: 'body', message_timestamp: 'body' } }),
    },
    {
      actionId: 'schedule_message',
      name: 'Schedule message',
      description: 'Schedule a message to be sent to a Slack channel at a future time.',
      intents: [
        'send a slack message later',
        'send a slack message tomorrow',
        'set a future slack message',
        'send at a specific time',
        'delay a slack notification',
        'queue a message for later',
        'send this to slack at 9am',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to send the message to.' },
        { name: 'text', type: 'text', required: true, description: 'Message text (supports Slack mrkdwn formatting).' },
        { name: 'post_at', type: 'number', required: true, description: 'Unix timestamp for when the message should be sent.' },
      ],
      outputFields: [
        { name: 'scheduled_message_id', type: 'string', description: 'ID of the scheduled message, usable for cancellation.' },
        { name: 'channel', type: 'string', description: 'Channel ID the message is scheduled for.' },
        { name: 'post_at', type: 'number', description: 'Unix timestamp when the message will be sent.' },
      ],
      execute: rest({ method: 'POST', path: '/chat.scheduleMessage', paramMapping: { channel: 'body', text: 'body', post_at: 'body' } }),
    },
    {
      actionId: 'read_messages',
      name: 'Read messages',
      description: 'Fetch recent messages from a Slack channel.',
      intents: [
        'see what was said in slack',
        'check the channel',
        'read recent messages',
        "what's been posted",
        'pull messages from slack',
        'catch up on a channel',
        'show me the latest in #general',
        'what did people say today',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to read messages from.' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of messages to return.', default: 20 },
        { name: 'oldest', type: 'string', required: false, description: 'Only return messages after this Unix timestamp.' },
        { name: 'latest', type: 'string', required: false, description: 'Only return messages before this Unix timestamp.' },
      ],
      outputFields: [
        { name: 'messages', type: 'array', description: 'Array of message objects, each with ts, user, text, and type.' },
        { name: 'has_more', type: 'boolean', description: 'True if more messages exist beyond the returned set.' },
        { name: 'response_metadata', type: 'object', description: 'Pagination metadata including next_cursor for fetching additional messages.' },
      ],
      execute: rest({ method: 'GET', path: '/conversations.history', paramMapping: { channel: 'query', limit: 'query', oldest: 'query', latest: 'query' } }),
    },
    {
      actionId: 'read_thread',
      name: 'Read thread',
      description: 'Fetch replies in a message thread.',
      intents: [
        'see the replies to a message',
        'read a slack thread',
        'what did people say in the thread',
        'get thread replies',
        'show me the conversation in this thread',
        'read replies to a slack message',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the thread.' },
        { name: 'ts', type: 'string', required: true, description: 'Timestamp of the parent message.' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of replies to return.', default: 50 },
      ],
      outputFields: [
        { name: 'messages', type: 'array', description: 'Array of message objects in the thread, each with ts, user, and text. The first item is the parent message.' },
        { name: 'has_more', type: 'boolean', description: 'True if more replies exist beyond the returned set.' },
        { name: 'response_metadata', type: 'object', description: 'Pagination metadata including next_cursor.' },
      ],
      execute: rest({ method: 'GET', path: '/conversations.replies', paramMapping: { channel: 'query', ts: 'query', limit: 'query' } }),
    },
    // ── Reactions ─────────────────────────────────────────────
    {
      actionId: 'add_reaction',
      name: 'Add reaction',
      description: 'React to a message with an emoji.',
      intents: [
        'react to a message',
        'add an emoji to a post',
        'thumbs up a message',
        'leave a reaction',
        'emoji react',
        'give a thumbsup in slack',
        'put a checkmark on that message',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the message.' },
        { name: 'message_timestamp', type: 'string', required: true, description: 'Timestamp of the message to react to.' },
        { name: 'emoji', type: 'string', required: true, description: 'Emoji name without colons, e.g. "thumbsup" or "white_check_mark".' },
      ],
      outputFields: [
        { name: 'ok', type: 'boolean', description: 'True if the reaction was added successfully.' },
      ],
      execute: rest({ method: 'POST', path: '/reactions.add', paramMapping: { channel: 'body', message_timestamp: 'body', emoji: 'body' } }),
    },
    {
      actionId: 'remove_reaction',
      name: 'Remove reaction',
      description: 'Remove an emoji reaction from a message.',
      intents: [
        'remove my reaction',
        'take back a reaction',
        'un-react to a message',
        'undo an emoji reaction in slack',
        'clear my reaction from a message',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the message.' },
        { name: 'message_timestamp', type: 'string', required: true, description: 'Timestamp of the message.' },
        { name: 'emoji', type: 'string', required: true, description: 'Emoji name without colons to remove.' },
      ],
      outputFields: [
        { name: 'ok', type: 'boolean', description: 'True if the reaction was removed successfully.' },
      ],
      execute: rest({ method: 'POST', path: '/reactions.remove', paramMapping: { channel: 'body', message_timestamp: 'body', emoji: 'body' } }),
    },
    {
      actionId: 'get_reactions',
      name: 'Get reactions',
      description: 'Get all emoji reactions on a specific message.',
      intents: [
        'see who reacted to a message',
        'what reactions are on this post',
        'check emoji reactions',
        'how did people react to that message',
        'show all reactions on a slack post',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID containing the message.' },
        { name: 'message_timestamp', type: 'string', required: true, description: 'Timestamp of the message.' },
      ],
      outputFields: [
        { name: 'message', type: 'object', description: 'The message object containing a reactions array, each with name, count, and users fields.' },
      ],
      execute: rest({ method: 'GET', path: '/reactions.get', paramMapping: { channel: 'query', message_timestamp: 'query' } }),
    },
    // ── Channels / Conversations ─────────────────────────────
    {
      actionId: 'list_channels',
      name: 'List channels',
      description: 'List public channels in the workspace.',
      intents: [
        'what channels are in this workspace',
        'show all slack channels',
        'list available channels',
        'find a slack channel',
        'browse channels in slack',
        'what rooms exist in slack',
      ],
      inputFields: [
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of channels to return.', default: 100 },
      ],
      outputFields: [
        { name: 'channels', type: 'array', description: 'Array of channel objects, each with id, name, is_private, num_members, and topic.' },
        { name: 'response_metadata', type: 'object', description: 'Pagination metadata including next_cursor for fetching additional channels.' },
      ],
      execute: rest({ method: 'GET', path: '/conversations.list', paramMapping: { limit: 'query' } }),
    },
    {
      actionId: 'get_channel_info',
      name: 'Get channel info',
      description: 'Get detailed information about a channel (name, topic, purpose, member count).',
      intents: [
        'get details about a channel',
        'look up a slack channel',
        'channel information',
        'what is this channel about',
        'show me info on a slack channel',
        'describe a slack channel',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to get info for.' },
        { name: 'include_num_members', type: 'boolean', required: false, description: 'Whether to include the member count.' },
      ],
      outputFields: [
        { name: 'channel', type: 'object', description: 'Channel object with id, name, topic, purpose, num_members, is_private, and created fields.' },
      ],
      execute: rest({ method: 'GET', path: '/conversations.info', paramMapping: { channel: 'query', include_num_members: 'query' } }),
    },
    {
      actionId: 'list_members',
      name: 'List channel members',
      description: 'List the members of a specific channel.',
      intents: [
        'who is in this channel',
        'see channel members',
        'list people in a slack channel',
        "who's in #engineering",
        'show everyone in a channel',
        'get the member list for a channel',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to list members for.' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of members to return.', default: 100 },
        { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor from a previous response.' },
      ],
      outputFields: [
        { name: 'members', type: 'array', description: 'Array of user ID strings who are members of the channel.' },
        { name: 'response_metadata', type: 'object', description: 'Pagination metadata including next_cursor for fetching additional members.' },
      ],
      execute: rest({ method: 'GET', path: '/conversations.members', paramMapping: { channel: 'query', limit: 'query', cursor: 'query' } }),
    },
    {
      actionId: 'create_channel',
      name: 'Create channel',
      description: 'Create a new Slack channel.',
      intents: [
        'make a new slack channel',
        'set up a channel',
        'create a room in slack',
        'add a new channel',
        'start a slack channel',
        'open a new channel for my team',
      ],
      inputFields: [
        { name: 'name', type: 'string', required: true, description: 'Name for the new channel (lowercase, no spaces, max 80 chars).' },
        { name: 'is_private', type: 'boolean', required: false, description: 'Whether to create a private channel.' },
      ],
      outputFields: [
        { name: 'channel', type: 'object', description: 'The newly created channel object with id, name, is_private, and created fields.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.create', paramMapping: { name: 'body', is_private: 'body' } }),
    },
    {
      actionId: 'archive_channel',
      name: 'Archive channel',
      description: 'Archive a Slack channel.',
      intents: [
        'archive a slack channel',
        'close a channel',
        'retire a slack channel',
        'deactivate a channel',
        'shut down a slack channel',
        'put a channel in archive',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to archive.' },
      ],
      outputFields: [
        { name: 'ok', type: 'boolean', description: 'True if the channel was archived successfully.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.archive', paramMapping: { channel: 'body' } }),
    },
    {
      actionId: 'invite_to_channel',
      name: 'Invite to channel',
      description: 'Invite users to a Slack channel.',
      intents: [
        'add someone to a channel',
        'invite a user to slack',
        'add a team member to a channel',
        'bring someone into a slack channel',
        'give someone access to a channel',
        'include a person in a slack channel',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to invite users to.' },
        { name: 'users', type: 'string', required: true, description: 'Comma-separated list of user IDs to invite.' },
      ],
      outputFields: [
        { name: 'channel', type: 'object', description: 'The updated channel object with id, name, and member list after the invite.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.invite', paramMapping: { channel: 'body', users: 'body' } }),
    },
    {
      actionId: 'set_topic',
      name: 'Set channel topic',
      description: 'Set the topic of a Slack channel.',
      intents: [
        'set the channel topic',
        'update the slack topic',
        'change the topic of a channel',
        'put a new topic in the channel header',
        'write a topic for a slack channel',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to set topic for.' },
        { name: 'topic', type: 'string', required: true, description: 'New topic text.' },
      ],
      outputFields: [
        { name: 'topic', type: 'string', description: 'The updated topic text that was set on the channel.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.setTopic', paramMapping: { channel: 'body', topic: 'body' } }),
    },
    {
      actionId: 'set_purpose',
      name: 'Set channel purpose',
      description: 'Set the purpose (description) of a Slack channel.',
      intents: [
        'set the channel purpose',
        'describe what a channel is for',
        'update channel description',
        'write a purpose for a slack channel',
        'explain what this channel is about',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to set purpose for.' },
        { name: 'purpose', type: 'string', required: true, description: 'New purpose text.' },
      ],
      outputFields: [
        { name: 'purpose', type: 'string', description: 'The updated purpose text that was set on the channel.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.setPurpose', paramMapping: { channel: 'body', purpose: 'body' } }),
    },
    {
      actionId: 'join_channel',
      name: 'Join channel',
      description: 'Join a public Slack channel.',
      intents: [
        'join a slack channel',
        'subscribe to a channel',
        'follow a channel',
        'become a member of a channel',
        'enter a slack channel',
        'get added to a channel',
      ],
      inputFields: [
        { name: 'channel', type: 'string', required: true, description: 'Channel ID to join.' },
      ],
      outputFields: [
        { name: 'channel', type: 'object', description: 'The channel object now joined, with id and name.' },
      ],
      execute: rest({ method: 'POST', path: '/conversations.join', paramMapping: { channel: 'body' } }),
    },
    // ── Users ─────────────────────────────────────────────────
    {
      actionId: 'list_users',
      name: 'List users',
      description: 'List all users in the Slack workspace.',
      intents: [
        'who is on the team',
        'list all slack users',
        'see the workspace members',
        'find everyone in slack',
        'get the team list',
        'show all people in this slack workspace',
        'browse the slack directory',
      ],
      inputFields: [
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of users to return.', default: 100 },
        { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor from a previous response.' },
      ],
      outputFields: [
        { name: 'members', type: 'array', description: 'Array of user objects, each with id, name, real_name, and profile.' },
        { name: 'response_metadata', type: 'object', description: 'Pagination metadata including next_cursor for fetching additional users.' },
      ],
      execute: rest({ method: 'GET', path: '/users.list', paramMapping: { limit: 'query', cursor: 'query' } }),
    },
    {
      actionId: 'get_user_info',
      name: 'Get user info',
      description: 'Get detailed profile information for a specific user.',
      intents: [
        'look up a slack user',
        "get someone's profile",
        'find user details',
        'who is this person in slack',
        "show a user's slack profile",
        "what's this person's display name",
      ],
      inputFields: [
        { name: 'user', type: 'string', required: true, description: 'User ID to get info for.' },
      ],
      outputFields: [
        { name: 'user', type: 'object', description: 'User object with id, name, real_name, is_bot, and profile (display_name, email, title, image_72).' },
      ],
      execute: rest({ method: 'GET', path: '/users.info', paramMapping: { user: 'query' } }),
    },
    {
      actionId: 'lookup_user_by_email',
      name: 'Lookup user by email',
      description: 'Find a Slack user by their email address.',
      intents: [
        'find a slack user by email',
        'who has this email address in slack',
        'look up someone by email',
        'search for a user using their email',
        'get slack profile from email address',
      ],
      inputFields: [
        { name: 'email', type: 'string', required: true, description: 'Email address to look up.' },
      ],
      outputFields: [
        { name: 'user', type: 'object', description: 'User object with id, name, real_name, and profile (email, display_name, title).' },
      ],
      execute: rest({ method: 'GET', path: '/users.lookupByEmail', paramMapping: { email: 'query' } }),
    },
  ],
})
