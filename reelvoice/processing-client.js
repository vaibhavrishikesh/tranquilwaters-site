const DEFAULT_API_BASE = "https://voice.tranquilwaters.in/voice";

export class ReelVoiceProcessingError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ReelVoiceProcessingError";
    this.status = status;
  }
}

const readMessage = async (response) => {
  try {
    const body = await response.json();
    return body.message || body.detail || body.error_message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
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
    const headers = { Accept: "application/json", Authorization: `Bearer ${this.token}` };
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

