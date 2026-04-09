I just came back from a great RSAC 2026. I work at [Keycard](https://keycard.ai), and at our expo booth, attendees could enter a raffle to win a Flipper 0 or a Mac Mini. At events like RSAC, you'd typically earn your raffle entry by offering up a badge scan, or by listening to a sales pitch. I wanted to do things a little differently, so I built an agent that uses Keycard and a purpose-built MCP server to conduct raffles. Booth visitors received a short live demo simply by entering the raffle itself.

![Keycard booth at RSAC](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/afznrvhc8fds5c5k0768.webp)

The Lockbox raffle agent is a demo that has _real stakes dependent on Keycard functionality_. The Lockbox conducts a live raffle, processing actual attendee information with an AI agent governed by real policy, with zero standing access.

![Lockbox UI](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tnweq8mkaeq6aj38wtdo.webp)

Booth staff log in with their Keycard email, then record raffle entries, draw winners, and manage events using natural language. The UI shows a lockbox visual next to the chat. This lockbox is a metaphor for how Keycard works. The box itself represents the state of agent access. The lock represents Keycard (the agent control plane). The resources (MCP server, data) are inside the box. When the box is locked, the agent has no access to any tools or data.

Each time the agent calls a tool, the lockbox cycles through visual states representing the credential lifecycle in real time. Every action is displayed in a live audit log.

![Attendees at RSAC 2026 entering the raffle with Lockbox](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6gi5xpyhl86z58rcxdco.webp)

**Each tool call independently obtains a scoped credential from Keycard, uses it once, and discards it.** The credential exists for the duration of a single function call, then it's gone. So what does that actually look like, and what are the stakes?

## Enter the Raffle: One Tool Call, End to End

When someone wants to enter the raffle, this is what happens:

{% embed https://www.youtube.com/watch?v=mhh7vFGDUdU %}

A Keycard booth staff member types: `Alice Jones, alice@example.com, ticket 123695.` The agent calls the `log_entries` MCP tool, and the Keycard lock visualization enters a "pending" state: this is an amber pulse that means the agent is pausing for human approval. No credential has been requested yet, and no token exchange has occurred.

All write actions require a human-in-the-loop (HITL). The agent must ask for permission to do a token exchange with Keycard for `raffle:write` access. The audit log displays an approval request, and the agent presents a dialog asking the human to deny or approve writing new raffle entry data.

![Lockbox pending HITL state](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/72692eps7k3ompzs7nav.gif)

Once the human clicks approve, Keycard (the lock) transitions to an "exchanging" state and evaluates governance policies. If the request is within policy, Keycard exchanges the staff member's access token via [RFC 8693 token exchange](https://docs.keycard.ai/platform/authorization/#rfc-8693-standard).

![Lockbox token exchange state](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/etiryqxrxbqcxhjnejza.gif)

The agent receives an ephemeral access token for the MCP server with the `raffle:write` scope. It uses this credential as a Bearer token to authorize a call to the MCP server, which records the new raffle entry.

The lock opens and the tool executes, writing the new raffle entry to the data store. After the call completes, the client discards the token (never stores it). This means that the agent never has standing access between tool calls.

![Lockbox unlocked state: credential issued, tool call in progress](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/c0d76inqqco9ci2mgsw0.gif)

There are two independent checkpoints: the human approves the intent, and then Keycard evaluates the credential request against [policies](https://docs.keycard.ai/console/access-policies/) defined by the user. For this demo, policy enforces that users authenticated through Google with Keycard emails can execute `write` tool calls, but any email outside the `@keycard.ai` domain will be denied.

Either HITL or policy can block independently. This matters because a human can still make a mistake, or just be overwhelmed by consent fatigue and clicking Approve on auto-pilot. Policy is evaluated _before_ any credentials are issued. Proactive, not reactive: there's no damage to control or credentials to revoke if something slips through the HITL checkpoint, because an out-of-policy token never even gets issued in the first place.

Each MCP call creates a fresh connection, passes the Bearer token, and tears everything down when the function returns. Think of it like a single-use key card that works once, for one door, and then gets shredded. There's nothing to steal between calls.

If you're interested in a more thorough explanation of how RFC 8693 token exchange works, [Keycard's Authorization docs](https://docs.keycard.ai/platform/authorization/#rfc-8693-standard) describe exactly how token exchange works at Keycard, step by step.

Okay, all of this is well and good, but it's not _that_ impressive of a demo yet. It shows data can be recorded if an authenticated human approves.

So what's _really_ at stake?

## Gaming the Raffle

After we log a booth visitor's raffle entry successfully, we can conspiratorially offer to guarantee that they win. We tell the agent, "Delete all the raffle entries except Alice's." If there's only one entry, that entry will be the winning draw. There is no trick to this, no safety in place that will stop the agent from presenting that sole entry as the winner. The MCP server's raffle drawing tool simply uses the list of entries and `crypto.randomInt` to pick a winner from the available dataset. It's straightforward, and it's fair.

{% embed https://www.youtube.com/watch?v=q7ewzDgejs0 %}

The agent is aware that this is a _very_ destructive action, so it warns the user that the entries will be permanently deleted from live data. Then it asks for permission to _read all the raffle entries_ in order to find the one that we want to preserve. Again, the agent has no standing access. Unless it's got a credential, it can't see the list of raffle entries "inside the box."

The MCP server has tools that let the agent view raffle entry data in a _masked_ format. The `get_entries` tool requires a `raffle:read` scope, but does _not_ require human-in-the-loop. This tool obfuscates the data before sending it to the agent. `Alice Jones` with email `alice@example.com` is sent back as `A*** J***` with an email of `a***@***.com`.

That's not enough information for the agent to figure out which entry belongs to Alice Jones, so it needs a `raffle:read-full` scope to call the `get_entries_full` tool. This difference in permission scope is significant because the agent needs human approval to read Personally Identifiable Information (PII). Raffle entries include PII like attendees' names and emails. The agent isn't allowed to access this data unless a human explicitly approves, and it can't find Alice's entry unless it's _granted access_ to read full names.

To make the first tool call, `get_entries_full`, the agent prompts the user for approval to retrieve the unmasked raffle data. We approve this action, and the agent finds Alice's entry.

_Then_ the agent can proceed to deleting every entry _except_ Alice's. This is the truly destructive tool call: `delete_entries`. The agent queues up the IDs of all the entries it's preparing to remove, and prompts the user for approval to call the deletion tool with scope `raffle:delete`.

![Lockbox audit log on the verge of deletion](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dak7r3402a0hy8f2624v.webp)

Now the YOLO moment: the human Keycard employee approves deletion. Again, nothing about this is a façade: the `delete_entries` tool really deletes raffle entries from the live dataset. Everyone but Alice will be removed from the very real raffle for very real prizes (Flipper 0, Mac Mini).

Even though the agent warned us _and_ asked for permission twice before arriving at actual deletion, we still happily clicked Approve for everything. The agent calls Keycard to make the token exchange, receives a response, then tells us _policy denied the exchange_.

No entries were deleted. No token exchange took place. No token with a `raffle:delete` scope was issued. There's no way for the agent to execute the `delete_entries` tool. Even if it _tried_ to make the tool call, without a token, it would get a `401: Unauthorized` error.

Why? How?

In Keycard, my `mcp-delete` policy forbids `raffle:delete` for all principals, with no exceptions and no overrides:

```rust
@id("mcp-delete")
forbid (
  principal is Keycard::Application,
  action,
  resource
)
when {
  resource has identifier &&
  resource.identifier == "https://mcp.lockbox.localhost:1355/mcp" &&
  context has scopes &&
  context.scopes.contains("raffle:delete")
};
```

Governance policies in Keycard are written using the [Cedar policy language](https://www.cedarpolicy.com/en). A `forbid` rule overrides all `permit` rules, so even if a user has admin permissions, the `raffle:delete` scope is blocked.

This is where the governance model becomes concrete. The human approved, the agent cooperated, and Keycard denied. Any of these actors can stop the chain. No single layer trusts the others, and if there's no access in the first place (no token issued), there's nothing to remediate.

> Note: The `delete_entries` tool does _back up_ the data first, as a precaution, because it really does delete raffle entries. And everyone knows live demos can take on a haunted nature of their own... but after dozens of times running this demo live, we never once had to restore from a backup.

## No Secrets on Disk

Keycard does something else for the Lockbox demo too. The Lockbox agent runs under [`keycard run`](https://docs.keycard.ai/guides/secure-agentic-coding/), Keycard's CLI. The demo runs locally, but it has to be installed on multiple trade show laptops. We don't run the demo off Keycard employee work machines. So how do you _easily_ manage secrets when you need to repeatedly install the demo clean on different environments?

Instead of sticking client secrets and static API keys in a gitignored `.env` file, or copying them out of a shared password vault, Lockbox uses the Keycard CLI and an `.env.template` file. Values are replaced with `{{kc+...}}` syntax to reference secrets managed securely in Keycard's vault, and the file gets checked into source control:

```env
KEYCARD_CLIENT_SECRET={{kc+urn:keycard:lockbox-client}}
LOCKBOX_ANTHROPIC_API_KEY={{kc+https://api.anthropic.com}}
```

At startup, `keycard run` resolves variables just-in-time, so there are no secrets on disk and no secrets in shell history. For [coding agents](/blog/announcing-keycard-for-coding-agents), `keycard run` also handles the task-based credential lifecycle natively: each tool call gets a fresh, scoped credential issued just-in-time, with policy evaluated before every use. The end-user-facing Lockbox demo implements the same lifecycle using the [Keycard TypeScript SDK](https://github.com/keycardai/typescript-sdk).

## The Lockbox Demo is Real

Yes, this is a "demo" but it also fully operates real event raffles. No tool calls are fake stubs, and nothing is simplified or hand-waved out of the implementation. For example, when I built Lockbox, I demoed it at a company All-Hands meeting. When demoing to all my colleagues, I _successfully deleted_ all the (test) raffle entries because I hadn't updated my policy after a breaking change in Keycard product development. (This is what led to me building the "create a backup" feature of the `delete_entries` tool. That plus a code freeze during RSAC meant no unexpected backend changes.)

Demos are great for folks outside the company, but they're also [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food). Building real stuff with Keycard means my feedback goes directly into product development. It's one of my favorite things about working at Keycard (I go into detail on dogfooding Keycard in my blog post [I Built and Authorized a Planning Agent with MCP and Keycard](https://dev.to/kimmaida/i-built-a-secure-planning-agent-with-mcp-and-keycard-324a)).

Most agent implementations default to standing access, broad permissions, and static keys. Task-scoped credentials and policy enforcement at issuance are a better fit for systems that think for themselves, and that's what Keycard provides. I built this demo to prove it works. It does.

If you want to try Keycard yourself, we're [currently in early access](https://keycard.ai/pricing) and we'd love to work with you and hear your feedback.

![Keycard staff at RSA booth](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/964lwll53dyyn1a5oj2s.webp)


---
원문: [https://dev.to/kimmaida/i-built-an-agent-to-run-live-event-raffles-then-tried-to-rig-it-al5](https://dev.to/kimmaida/i-built-an-agent-to-run-live-event-raffles-then-tried-to-rig-it-al5)
수집일: 2026-04-09 06:00:02
