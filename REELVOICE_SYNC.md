# ReelVoice — Shared Sync

**Date:** 18 October 2026  
**Purpose:** One checklist for today's work across the web/backend lane and the Android/Play Console lane.

## Current state

- Web Google Sign-In is wired with the Cosmos Web Client.
- Google OAuth origin is configured for `https://tranquilwaters.in`.
- Production API CORS now allows the ReelVoice web origin; the preflight check passes.
- Android UI polish is pushed to `main`.
- Play Console has `pro_monthly` active at ₹80/month.
- `pro_annual` exists; its price and activation are still pending.

## Today's checklist

### DeepAI bhai — Android / Play Console

- [ ] Set the annual plan price: `pro_annual` — ₹599/year.
- [ ] Activate the annual base plan after checking the product ID and price.
- [ ] Confirm both monthly and annual plans are attached to the ReelVoice app (`com.reelvoice`).
- [ ] Generate a signed AAB from the current `main` branch.
- [ ] Upload the AAB to Play Console Internal testing.
- [ ] Record the build number, artifact path, and Play Console release status here.
- [ ] Complete service-account setup only if Play Console upload automation needs it.

### Baba — Web / backend verification

- [ ] Hard-refresh the production account page and complete Google login with a real test account.
- [ ] Confirm the account page receives a session and returns to `cleaning.html#studio`.
- [ ] Verify `/voice/auth/google/` returns a user session for a valid Google ID token.
- [ ] Verify a signed-in user can reach the cleaning dashboard and sees the correct free-plan limits.
- [ ] Improve the web error message to show the API's returned auth error when login fails.
- [ ] Push any web/backend fixes with a short commit and record the commit hash below.

### Joint handoff

- [ ] Keep product IDs, package name, price, and build number identical in the web copy, Android app, and Play Console.
- [ ] Do not unlock Pro features from the client alone; verify the purchase/license on the backend first.
- [ ] Add test evidence and blockers in the log below before moving to the next release step.

## Verification log

| Time (IST) | Owner | Check | Result / evidence |
|---|---|---|---|
|  |  | Google login on production |  |
|  |  | Annual plan activated |  |
|  |  | Signed AAB uploaded |  |
|  |  | Internal tester purchase/restore |  |

## Handoff notes

- **Web URL:** `https://tranquilwaters.in/reelvoice/account.html`
- **API URL:** `https://voice.tranquilwaters.in/voice`
- **Google Web Client ID:** stored in the deployed account page and backend environment; do not put secrets in this document.
- **Current release gate:** final Google login test, annual plan activation, signed AAB upload, and backend-validated purchase test.

