# Authentication System

> Task: "Add JWT authentication with login and signup"

---

🏗️ **Architect**: Proposed design:

```
src/
  auth/
    middleware.js  — verifyToken middleware for protected routes
    controller.js  — login/signup handlers
    service.js     — password hashing, token generation
  models/
    user.js        — User schema (email, hashedPassword, createdAt)
```

Key decisions:
- bcrypt for password hashing (cost factor 12)
- JWT with 15-minute access tokens + 7-day refresh tokens
- Refresh tokens stored in httpOnly cookies, access tokens in response body
- No session storage — stateless auth

@Challenger: fire away.

---

😈 **Challenger**: Four issues, two are critical:

**CRITICAL:**
1. No rate limiting on `/login`. An attacker can brute-force passwords at machine speed. At minimum: 5 attempts per IP per minute.
2. JWT secret from `process.env.JWT_SECRET` — but what if it's not set? The app will silently use `undefined` as the secret, which means `jwt.sign()` throws at runtime with a cryptic error instead of failing fast at startup.

**Medium:**
3. Refresh token rotation is missing. If a refresh token is stolen, the attacker has 7 days of access with no way to revoke it.
4. No password complexity requirements. Users will set "password" as their password.

---

🏗️ **Architect**: All valid. Revisions:

1. Add express-rate-limit: 5 login attempts/IP/minute with 429 response
2. Validate `JWT_SECRET` at startup — throw immediately if missing
3. Add refresh token rotation: each refresh generates a new token pair and invalidates the old refresh token (store token family ID)
4. Minimum 8 chars, at least one number and one letter. No complexity theater (no "must include special char" — it doesn't meaningfully improve security)

Good catch on the silent undefined — that's a real production incident waiting to happen.

@Builder: proceed.

---

💻 **Builder**: Implemented. 6 files. Key implementation details:

- `service.js` validates JWT_SECRET on import (fail-fast)
- Rate limiter is standalone middleware, reusable on any route
- Refresh token rotation uses a `tokenFamily` field — if a reused token is detected, all tokens in that family are revoked (detects token theft)
- Password validation in controller, not model (keeps model clean)

@Reviewer @Breaker: ready.

---

🔍 **Reviewer**: Clean implementation. A few observations:

1. Token family revocation logic is correct — the "reuse detection" pattern from the OAuth 2.0 spec
2. bcrypt cost factor 12 is fine for 2024 hardware (~250ms per hash)
3. Rate limiter returns `Retry-After` header — good, clients can back off properly

One issue: the signup endpoint returns the user object including `hashedPassword`. Filter it out before sending the response. This is a data leak.

---

🧪 **Breaker**: Testing attack scenarios:

1. **Timing attack on login**: `bcrypt.compare` is constant-time, so "user not found" vs "wrong password" isn't distinguishable by timing. But the response *message* differs: "User not found" vs "Invalid password". An attacker can enumerate valid emails. Fix: return the same message for both cases.

2. **JWT algorithm confusion**: If the server accepts `alg: "none"`, any unsigned token is valid. Verified that `jsonwebtoken` rejects `none` by default — we're safe, but add an explicit `algorithms: ['HS256']` to `jwt.verify()` as defense in depth.

3. **Refresh token in response body**: The design says httpOnly cookie, but the implementation returns it in the JSON body. Cookie was the right call — body means JavaScript can read it, which means XSS = full account takeover.

Bug 3 is critical. The others are important hardening.

---

📊 **5 agents** · 6 messages · 2 revisions · 3 bugs caught · 6 files · 120s
