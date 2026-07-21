/*
 * The /check route is shareable via an encoded query param (spec §6). We
 * base64url-encode the UTF-8 message so links survive copy/paste and never
 * expose raw text with URL-breaking characters. This is not security — the
 * analysis is public — just safe transport.
 */

export function encodeMessage(text: string): string {
  const utf8 = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of utf8) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeMessage(param: string): string {
  try {
    const base64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}
