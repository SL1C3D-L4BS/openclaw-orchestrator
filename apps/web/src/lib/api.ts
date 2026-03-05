import axios from "axios";
import type { SkillManifest, ValidateResult } from "@/types/skill";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

const client = axios.create({ baseURL: API_BASE, timeout: 15_000 });

export async function validateSkillChain(
  manifest: SkillManifest
): Promise<ValidateResult> {
  const { data } = await client.post<ValidateResult>(
    "/api/v1/skills/validate",
    manifest
  );
  return data;
}

export async function exportSkillChain(
  manifest: SkillManifest
): Promise<Blob> {
  const { data } = await client.post("/api/v1/skills/export", manifest, {
    responseType: "blob",
  });
  return data as Blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
