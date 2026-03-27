I got tired of explaining privacy policies to people.

Every time I needed to send a file to someone, I had to pick a service and implicitly trust it. Trust that it wasn’t reading my files. Trust that it wasn’t training a model on my documents. Trust that when it said “we don’t look at your stuff” it actually meant it.

I couldn’t verify any of that. Neither could you.
So I built phntm.sh. And I want to be honest about what it is, what it isn’t, and where it’s still rough.

## The core idea
Zero-knowledge means the server genuinely cannot read your files. Not “won’t.” Cannot.

Here’s how it works. When you drop a file into phntm, your browser generates a 256-bit AES key. The file gets encrypted client-side with AES-256-GCM before a single byte leaves your machine. Only the ciphertext goes to the server. The decryption key gets embedded in the URL fragment, the part after the #.

Here’s the important bit. Browsers never include the fragment in HTTP requests. It’s in the spec. RFC 3986. When you share a phntm link, the recipient’s browser downloads the ciphertext and decrypts it locally using the key from the fragment. My server never sees the key. Ever.

I store noise. Without the key, the ciphertext is mathematically useless.

## Why open source
Because “trust us” is not an architecture.

I open-sourced both the web app and the CLI so you can verify the claims yourself. Don’t take my word for it. Read the crypto layer. Check that the key never gets sent anywhere. That’s the only honest thing to do when you’re making security claims.

## The rough edges, and I mean it
I’m being honest here because this is build in public, not a product launch.

The encryption buffers the whole file in memory. For large files that’s a problem. I know. It’s on the list.

The CLI flag parsing is basic. I rolled it myself instead of using a library, which was a good learning exercise but means it’s not as robust as it should be.

I had Vercel Analytics on the page. A commenter flagged it and they were right to. The RFC holds. browsers don't send fragments in HTTP requests. But Vercel Analytics reads location.href client-side, which includes the hash, and POSTs it to their endpoint. That's a problem when the hash is your decryption key.

Fixed with a beforeSend hook that strips the fragment before the event fires. Lesson learned: audit every third party script when you're making security claims, including the ones you added without thinking.

## What it’s good for right now
Sending a file to someone who doesn’t have any tools installed. They get a link, they click it, it decrypts in their browser, it downloads. No account. No app. No signup.

The file self-destructs when the timer expires. Nothing to breach after that.

## What I learned building this
I built the CLI in Go as my first real Go project. Not a tutorial project. Something I’d actually use.

The thing that made Go’s I/O model click for me was wrapping io.Reader to build a progress bar. The HTTP client does io.Copy and the bar updates itself as bytes flow through. Small thing but it changed how I think about composability.

The whole CLI is stdlib-only. No external deps. That was a deliberate choice and also a good constraint for learning.

Where it lives
https://phntm.sh
https://github.com/aliirz/phntm.sh
https://github.com/aliirz/phntm-cli

Feedback welcome. Especially on the crypto layer.

---
원문: [https://dev.to/aliirz/i-built-a-file-transfer-tool-that-cant-spy-on-you-even-if-it-wanted-to-2p39](https://dev.to/aliirz/i-built-a-file-transfer-tool-that-cant-spy-on-you-even-if-it-wanted-to-2p39)
수집일: 2026-03-27 21:54:45
