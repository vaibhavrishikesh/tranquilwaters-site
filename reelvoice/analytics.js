/* Analytics contract: safe event names only; never include files, tokens, or account data. */
export const trackReelVoiceEvent = (name, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  if (typeof window.gtag === "function") window.gtag("event", name, { event_category: "reelvoice", ...params });
};
