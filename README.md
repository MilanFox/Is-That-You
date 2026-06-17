<div align="center">
  <img src="assets/capsule.png" alt width="1000">
</div>

# Is that you?

We are living in a world where even I, a digital native software developer have a hard time differentiating between real
Humans and Speech Synthesis models from time to time if I don't pay attention. For more vulnerable target audiences, our
parents for example, this is even harder.

"Is that you" is a tiny, offline tool that helps you check whether a caller is really who they claim to be. You and the
people you trust share one passphrase; every device then shows the **same codeword**, which changes every 5 minutes.
When someone calls and asks for something sensitive, you ask them for the current codeword — if they can't say it, they
aren't who they claim.

## How it works

- Each entry derives a key from a shared passphrase using **PBKDF2-SHA256**.
- The current codeword is `HMAC-SHA256(key, current 5-minute window)` mapped onto a wordlist (German or English).
- It is fully **deterministic and offline**: the same passphrase, in the same 5-minute window, produces the same word on
  every device. No server, no account, no network call.
- The passphrase itself is **never stored**, we store a key derived from it. Does that really make a difference?
  Probably no. But it felt better.

## Using it

1. Add a codeword: give it a "group" name and the shared passphrase, pick a wordlist language.
2. Everyone in the group enters the **same** passphrase (case-sensitive) and the **same** language.
3. To verify a caller: **let them say the codeword first**, then compare it with yours.

## Run / install

It's a set of static files. Serve them over **HTTPS** (required for the Web Crypto API) and open in a browser. On phone
or desktop, use *Add to home screen* / *Install* to run it as a PWA after opening the deployed (or self hosted)
version. It works offline after the first load.

```sh
# quick local test
python3 -m http.server
```

## Privacy

Everything stays on the device. The passphrase never leaves it and is never written in plain text — only a
PBKDF2-derived key is kept in local storage.

## Notes & limits

- The protection is **one-directional**: the caller must say the word. If you say it first, it's worthless.
- Use a strong passphrase - several random words, not `family2024`.
- All devices need a roughly correct clock (the window is 5 minutes). It should be Timezone-safe though.
- The stored key can still generate codes (it has to, since there's no server). Not storing the passphrase means the
  original phrase can't be recovered, not that a stolen device is harmless. For at-rest protection, add a device
  lock/PIN.
