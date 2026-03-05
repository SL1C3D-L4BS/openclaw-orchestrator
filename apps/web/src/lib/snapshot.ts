import { toPng } from "html-to-image";

const DEFAULT_OPTIONS = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "#09090b",
  style: {
    borderRadius: "8px",
  },
};

/**
 * Captures a DOM element (e.g. the React-Flow canvas container) as a high-resolution PNG.
 * @param element - The HTML element to capture
 * @returns Data URL of the PNG, or null if capture failed
 */
export async function captureElementAsPng(
  element: HTMLElement | null
): Promise<string | null> {
  if (!element) return null;
  try {
    const dataUrl = await toPng(element, DEFAULT_OPTIONS);
    return dataUrl;
  } catch (err) {
    console.error("Snapshot capture failed:", err);
    return null;
  }
}

/**
 * Converts a data URL to a Blob for download or upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/png";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new Blob([u8], { type: mime });
}
