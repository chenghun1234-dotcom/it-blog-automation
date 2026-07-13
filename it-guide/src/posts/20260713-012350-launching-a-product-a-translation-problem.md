## Launching a Product: A Translation Problem

Launching a product is a translation problem. Hacker News punishes anything that smells like marketing. X gives you 280 characters. The Play Store gives you 30 for a title and 80 for the short description, and the Chrome Web Store will reject a keyword-stuffed name outright. Same product, fifteen dialects.

I kept paying that tax on my own extension launches, so I built **[LaunchPad](https://launch.tapdot.org)**: you write one product brief, and it drafts a native post for 42 channels — each in that channel's voice, with its real character limits enforced at generation time. It launched on Product Hunt this weekend. This post is about the parts that were harder than they looked.

## The Stack

React 18 + Vite on AWS Amplify, Lambda + DynamoDB + API Gateway behind Cognito, Terraform for everything. The interesting choice is the AI layer: there isn't a server-side one. Drafting runs either on Chrome's built-in Gemini Nano (the Prompt API — free, on-device, nothing leaves your machine) or against the user's own OpenAI/Claude key, called directly from the browser. My servers never see a prompt, a draft, or a key. That's a privacy feature and a business model at once: my marginal cost per free user is roughly zero, so the entire product can be free for your first launch.

## The Bug That Ate Every AI Draft

The editor is TipTap (ProseMirror). During generation, I lock each section by toggling `setEditable(false)`. Drafts started vanishing: the AI would finish, the success toast would fire, and the editor would sit there empty.

The cause took a full evening: **TipTap v3 emits `update` events for programmatic changes too.** `setEditable()` and `setContent()` both fire the same `onUpdate` as a keystroke. So the lock itself triggered `onChange('')` — an empty "manual edit" that overwrote the freshly generated draft in the store, stamped **manual** provenance on it, and autosaved the damage.

The fix is a ref that marks self-inflicted mutations:

```javascript
const applyingExternal = useRef(false);

onUpdate: ({ editor }) => {
  if (applyingExternal.current) return; // our own mutation, not the user's
  onChange(htmlToMd(editor.getHTML()));
},

useEffect(() => {
  applyingExternal.current = true;
  editor.setEditable(!readOnly);
  applyingExternal.current = false;
}, [readOnly]);
```

The general lesson: any rich-text editor's change event answers "did the document change?", not "did the **user** change it?". If you sync editor state to a store, you need to answer the second question yourself.

## Stale Responses That Eat Local Edits

Twice — once for projects, once for preferences — I hit the same shape of bug: a GET fires on mount, the user makes a local change, the GET response lands **after** the change and replaces state wholesale. The user's brand-new custom channel just… evaporates. It surfaced as a flaky e2e test that only failed in-suite, which I almost retry-looped away before realizing the flake **was** the bug.

The guard is a version counter, not a lock:

```javascript
loadPrefs: async () => {
  const ver = get()._prefsVer;
  const prefs = await api.getPrefs();
  if (get()._prefsVer !== ver) return; // a local write won the race — discard
  set((s) => ({ prefs: { ...s.prefs, ...prefs } }));
},
updatePrefs: (fields) => {
  set((s) => ({ _prefsVer: s._prefsVer + 1, prefs: { ...s.prefs, ...fields } }));
},
```

If your local state is the source of truth (it should be), a server response is a **suggestion** that expires the moment the user acts.

## Character Limits: Models Can't Count

Every channel section carries its real limit — HN titles ≤80, Play Store short description ≤80, App Store keywords ≤100. Small on-device models blow past them constantly, and no prompt phrasing fixes it, because counting characters just isn't something a language model does reliably.

What shipped: the limit goes into the prompt ("HARD LIMIT … counting characters, not words — drop hashtags first"), the output gets measured in actual code, and there are up to two corrective retries that feed the overlong draft back with its measured length. Keep the shortest attempt. If it's **still** over, say so honestly — "Title is still over its limit, trim it by hand" — and paint the counter red. Users forgive a model that can't count; they don't forgive a tool that pretends it can.

## Bulk Generation Is a Distributed System in One Tab

"Generate all 42" sounds like a for-loop. The for-loop version fails four ways:

1.  **One 429 killed the run.** A rate limit on channel 9 abandoned channels 10–42. Now every channel runs regardless, outcomes are collected, and a report says `28 drafted · 1 failed (rate limit) · 2 skipped` — and a failed channel keeps its previous draft **and** its provenance metadata untouched.
2.  **Nothing saved until the end.** Autosave was debounced; 42 channels of continuous store writes reset the debounce forever, so a reload at channel 40 lost everything. Persistence now flushes after **every** channel.
3.  **No way out.** Cancel now stops after the current section and keeps the finished work — "Cancel — keep what's drafted" — because the alternative reading of cancel (throw everything away) is never what anyone wants.
4.  **Toast spam.** Leave the editor mid-run and each channel's success toast followed you around the app. During bulk runs, individual toasts are silenced; the report speaks once.

None of these showed up until a real user ran a real 42-channel generation with a real flaky key.

## The Payment Bug: Your Email Is Not Your Identity

The webhook from my payment provider (Lemon Squeezy) identifies the buyer by email, so I resolved email → user and upgraded them. Tested it, worked, shipped it.

Then my own test payment upgraded… nothing I could see. The reason: **one email can be several accounts.** My address existed twice in Cognito — a Google-federated identity (my real login) and a native password user (the e2e test account). The `Limit: 1` lookup upgraded whichever DynamoDB returned first, which was the wrong one. Any real user who'd ever signed in two ways would have paid and stayed on the free plan.

The fix is embarrassingly simple — update **every** account matching the payer's email — but the class of bug is worth internalizing: email is contact info, not a primary key.

While I was in there: `subscription_cancelled` means **will not renew**, not **expired**. Downgrading on cancel steals the month the customer already paid for. Keep the tier until the `expired` event arrives.

## Two CSS Lines That Cost Half a Day Each

`overflow-x: hidden` on `html, body` — added innocently for mobile sideways-scroll protection — **silently disables `position: sticky`** everywhere. The spec-compliant fix is `overflow-x: clip`, which clips without creating a scroll container. My sticky top bar was broken for two deploys before anyone noticed.

And `backdrop-filter` on that same top bar creates a **containing block**: any `position: fixed` child gets trapped inside the bar's box. My ⌘K command palette rendered as a black strip inside the header and swallowed outside clicks until I portaled it to `document.body`.

## The Regression Suite Is the Actual Product

The thing I'd defend hardest isn't a feature. It's the 21-test Playwright suite that runs **against production** — on every deploy as a release gate, and nightly on cron. Every bug a user reported this month became a permanent sentinel: security headers served, deep links returning real 200s (Amplify's SPA fallback quietly serves HTTP 404 on every route unless you add an explicit rewrite — renders fine, poisons link unfurlers), zero horizontal overflow at 390px, the sticky bar surviving a scroll, and the full OpenAI/Claude pipeline exercised with the provider APIs intercepted at the network layer — asserting auth headers, model, and body shape with zero API spend.

A UI regression suite against the live site feels like overkill until the first time it catches a stripped stylesheet before a user does. Mine paid for itself in week one.

## Where It's At

LaunchPad is live at **[launch.tapdot.org](https://launch.tapdot.org)** — there's a **[sample launch you can explore without signing up](https://launch.tapdot.org/demo)** if you want to see what one brief turns into. Everything is free for your first launch, including the cloud engines with your own key.

I'd genuinely like feedback on the channel prompts — each of the 42 has a hand-tuned "native voice" instruction, and the difference between a Show HN that survives and one that sinks lives in those words. If you launch somewhere I don't cover, tell me and it'll probably exist by next week: most of this product was built from user requests within hours of hearing them.

Happy to answer anything about the Prompt API, the BYO-key architecture, or the regression setup in the comments.

---
원문: [https://dev.to/mohanvenkatakrishnan/building-launchpad-one-product-brief-42-launch-channels-and-the-bugs-that-almost-sank-it-3ii7](https://dev.to/mohanvenkatakrishnan/building-launchpad-one-product-brief-42-launch-channels-and-the-bugs-that-almost-sank-it-3ii7)
수집일: 2026-07-13 01:23:50
