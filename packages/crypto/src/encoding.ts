export function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function fingerprintPublicKey(b64: string): string {
  const chunks: string[] = [];
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  for (let i = 0; i < Math.min(30, clean.length); i += 5) {
    chunks.push(clean.slice(i, i + 5));
  }
  return chunks.join(" ");
}
