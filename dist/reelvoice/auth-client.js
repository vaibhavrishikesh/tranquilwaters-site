/**
 * Small browser client for ReelVoice's shared voice-auth contract.
 *
 * The landing page stays public; this module is the transport layer used by
 * the future account/studio screens. Tokens live in sessionStorage so a
 * browser session can be restored without persisting credentials indefinitely.
 */

const DEFAULT_API_BASE = "https://voice.tranquilwaters.in/voice";
const TOKEN_KEY = "reelvoice.auth.token";

const responseMessage = async (response) => {
  try {
    const body = await response.json();
    return body.detail || body.message || body.reason || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

export class ReelVoiceAuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ReelVoiceAuthError";
    this.status = status;
  }
}

export class ReelVoiceAuthClient {
  constructor({ apiBase = DEFAULT_API_BASE, storage = window.sessionStorage } = {}) {
    this.apiBase = apiBase.replace(/\/$/, "");
    this.storage = storage;
  }

  get token() {
    return this.storage.getItem(TOKEN_KEY);
  }

  set token(value) {
    if (value) this.storage.setItem(TOKEN_KEY, value);
    else this.storage.removeItem(TOKEN_KEY);
  }

  async request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`${this.apiBase}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new ReelVoiceAuthError(await responseMessage(response), response.status);
    return response.json();
  }

  async register({ email, password, displayName }) {
    const data = await this.request("/auth/register/", {
      method: "POST",
      auth: false,
      body: { email, password, ...(displayName ? { display_name: displayName } : {}) },
    });
    this.token = data.token;
    return data.user;
  }

  async login({ email, password }) {
    const data = await this.request("/auth/login/", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    this.token = data.token;
    return data.user;
  }

  async loginWithGoogle(idToken) {
    const data = await this.request("/auth/google/", {
      method: "POST",
      auth: false,
      body: { id_token: idToken },
    });
    this.token = data.token;
    return data.user;
  }

  async me() {
    if (!this.token) return null;
    try {
      const data = await this.request("/auth/me/");
      return data.user;
    } catch (error) {
      if (error instanceof ReelVoiceAuthError && error.status === 401) this.logoutLocal();
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) await this.request("/auth/logout/", { method: "POST", body: {} });
    } finally {
      this.logoutLocal();
    }
  }

  logoutLocal() {
    this.token = null;
  }

  async requestPasswordReset(email) {
    await this.request("/auth/password-reset/", {
      method: "POST",
      auth: false,
      body: { email },
    });
  }
}

export const reelVoiceAuth = new ReelVoiceAuthClient();
