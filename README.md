# @weldable/integration-slack

Slack messaging and channel actions for Weldable.

Part of the [Weldable](https://weldable.ai/) integration library — see [@weldable/integration-core](https://github.com/weldable/integration-core) for the full catalog.

## Install

```bash
npm install @weldable/integration-slack @weldable/integration-core
```

`@weldable/integration-core` is a peer dependency and must be installed alongside this package.

## Usage

```ts
import integration from '@weldable/integration-slack'

// Post a message
const post = integration.actions.find(a => a.id === 'slack.post_message')!

const result = await post.execute(
  {
    channel: '#deployments',
    text: 'Release v1.2.0 deployed to production. :white_check_mark:',
  },
  ctx, // ActionContext from your Weldable-compatible host
)

// Read recent messages
const read = integration.actions.find(a => a.id === 'slack.read_messages')!

const messages = await read.execute(
  { channel: 'C01234ABCDE', limit: 10 },
  ctx,
)

// Reply in a thread
const reply = integration.actions.find(a => a.id === 'slack.reply_to_thread')!

await reply.execute(
  {
    channel: 'C01234ABCDE',
    thread_ts: result.ts as string,
    text: 'Rollback plan is ready if needed.',
  },
  ctx,
)
