import type { GeneratedComponent, Provider } from '../types';

export const STORAGE_KEYS = {
  apiKey: 'rcg.apiKey',
  provider: 'rcg.provider',
  history: 'rcg.history',
  components: 'rcg.components',
} as const;
export const MAX_HISTORY = 20;

const DEFAULT_PROVIDER: Provider = 'google';
const PROVIDERS: readonly Provider[] = ['anthropic', 'google'];

/** localStorage 접근/파싱 실패(비공개 모드, 깨진 JSON 등)는 null로 흡수한다. */
function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과·저장소 차단 시에도 앱은 계속 동작해야 한다.
  }
}

export function loadApiKey(): string {
  const value = readJSON(STORAGE_KEYS.apiKey);
  return typeof value === 'string' ? value : '';
}

export function loadProvider(): Provider {
  const value = readJSON(STORAGE_KEYS.provider);
  return PROVIDERS.includes(value as Provider) ? (value as Provider) : DEFAULT_PROVIDER;
}

export function loadHistory(): string[] {
  const value = readJSON(STORAGE_KEYS.history);
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return [];
  return value;
}

export function loadComponents(): GeneratedComponent[] {
  const value = readJSON(STORAGE_KEYS.components);
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): GeneratedComponent[] => {
    if (
      item === null ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      typeof item.prompt !== 'string' ||
      typeof item.code !== 'string'
    ) {
      return [];
    }
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) return [];
    return [{ id: item.id, prompt: item.prompt, code: item.code, createdAt }];
  });
}

export function addToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_HISTORY);
}
