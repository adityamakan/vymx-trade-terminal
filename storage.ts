import LZString from 'lz-string';

export const compressData = (data: any): string => {
  try {
    const stringified = JSON.stringify(data);
    return LZString.compressToUTF16(stringified);
  } catch (e) {
    console.error("[Data Integrity Error] Failed to compress data", e);
    return JSON.stringify(data);
  }
};

export const decompressData = <T>(compressed: string | null, fallback: T): T => {
  if (!compressed) return fallback;
  try {
    // Check if it's already a regular JSON (e.g., from old version before compression)
    if (compressed.startsWith('[') || compressed.startsWith('{')) {
      return JSON.parse(compressed) as T;
    }
    const decompressed = LZString.decompressFromUTF16(compressed);
    if (!decompressed) {
      // Fallback in case of decompression failure that returns null
      return fallback;
    }
    return JSON.parse(decompressed) as T;
  } catch (e) {
    console.error("[Data Integrity Error] Failed to decompress data", e);
    return fallback;
  }
};
