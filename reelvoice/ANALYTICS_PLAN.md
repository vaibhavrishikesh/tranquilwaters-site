# ReelVoice web measurement plan

The first implementation keeps the event contract provider-neutral. Events are
queued in `dataLayer` and forwarded to `gtag` when a GA4 tag is configured.

## Events

| Event | When | Safe parameters |
| --- | --- | --- |
| `landing_view` | Landing page loads | none |
| `app-download` | App download CTA is clicked | conversion name |
| `upload_selected` | A local audio/video file is selected | `media_type` |
| `process_auth_required` | Processing is attempted without a session | `media_type` |
| `job_started` | Authenticated upload is accepted by the browser | `media_type` |
| `job_completed` | Polling returns a downloadable result | `media_type`, `job_type` |
| `job_failed` | Upload or processing fails | `media_type`, coarse `error_status` |

Raw files, filenames, email addresses, auth tokens, job IDs, and result URLs are
never sent to analytics or advertising platforms.

## Rollout

1. Add the GA4 measurement ID and consent-aware Google tag on public marketing pages.
2. Mark signup, app download, and first completed job as conversions in GA4.
3. Link GA4 to Google Ads and import only those conversion actions.
4. Run a small `/reelvoice/` campaign after authenticated processing is verified with a real test account.

