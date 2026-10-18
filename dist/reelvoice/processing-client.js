const DEFAULT_API_BASE = "https://voice.tranquilwaters.in/voice";

export class ReelVoiceProcessingError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ReelVoiceProcessingError";
    this.status = status;
  }
}

const stringifyError = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(stringifyError).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => {
        const message = stringifyError(item);
        return message ? `${key}: ${message}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return String(value);
};

const readMessage = async (response) => {
  try {
    const body = await response.json();
    const message = stringifyError(body.message || body.detail || body.error_message || body.error || body.reason || body.errors);
    if (message) return message;
  } catch {
    // Some upstream failures return an empty body or plain text.
  }
  if (response.status === 401 || response.status === 403) return 'Your session expired. Sign in again and retry.';
  return `Request failed (${response.status})`;
};

export const readProcessingError = (value, fallback = 'Processing failed.') => {
  const message = stringifyError(value?.error_message || value?.message || value?.detail || value?.error || value?.reason || value?.errors);
  return message || fallback;
};

export class ReelVoiceProcessingClient {
  constructor({ apiBase = DEFAULT_API_BASE, token } = {}) {
    this.apiBase = apiBase.replace(/\/$/, "");
    this.token = token;
  }

  resolveUrl(value) {
    if (!value) return null;
    try { return new URL(value, `${this.apiBase}/`).toString(); } catch { return value; }
  }

  async request(path, { method = "GET", body } = {}) {
    // ReelVoice's web session uses an opaque account token. The processing
    // endpoints currently accept requests without this header, while DRF's
    // global JWT authenticator rejects that opaque value when it is sent as
    // `Authorization: Bearer ...`. Do not advertise it as a JWT here.
    const headers = { Accept: "application/json" };
    const response = await fetch(`${this.apiBase}${path}`, { method, headers, body });
    if (!response.ok) throw new ReelVoiceProcessingError(await readMessage(response), response.status);
    return response.json();
  }

  async submit(file, mediaType) {
    if (!this.token) throw new ReelVoiceProcessingError("Sign in before processing a file.");
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("mode", "standard");
    form.append("adaptive", "true");
    const path = mediaType === "video" ? "/video/process/" : "/reel/";
    if (mediaType === "video") form.append("job_type", "video_reel");
    else form.append("output_format", "mp3");
    return this.request(path, { method: "POST", body: form });
  }

  async poll(jobId, { onUpdate, intervalMs = 2200, timeoutMs = 180000 } = {}) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const rawStatus = await this.request(`/status/${encodeURIComponent(jobId)}/`);
      const status = {
        ...rawStatus,
        output_audio_url: this.resolveUrl(rawStatus.output_audio_url),
        output_video_url: this.resolveUrl(rawStatus.output_video_url),
        cleaned_url: this.resolveUrl(rawStatus.cleaned_url),
      };
      onUpdate?.(status);
      if (["completed", "failed"].includes(status.status)) return status;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new ReelVoiceProcessingError("Processing is taking longer than expected. Check History shortly.");
  }
}

