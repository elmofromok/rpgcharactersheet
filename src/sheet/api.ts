import type { CharacterDocument } from "../character.ts";
import type { CharacterSummary, Revision } from "../storage/store.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export function listCharacters(): Promise<CharacterSummary[]> {
  return request<CharacterSummary[]>("/api/characters");
}

export function fetchCharacter(id: string): Promise<CharacterDocument> {
  return request<CharacterDocument>(`/api/characters/${id}`);
}

export function saveCharacter(character: CharacterDocument): Promise<Revision> {
  return request<Revision>(`/api/characters/${character.id}`, {
    method: "PUT",
    body: JSON.stringify(character),
  });
}
