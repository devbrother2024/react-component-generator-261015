import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  MAX_HISTORY,
  loadApiKey,
  loadProvider,
  loadHistory,
  loadComponents,
  saveValue,
  addToHistory,
} from './persist';

beforeEach(() => {
  localStorage.clear();
});

describe('loadApiKey', () => {
  it('저장된 값이 없으면 빈 문자열을 반환한다', () => {
    expect(loadApiKey()).toBe('');
  });

  it('저장된 API 키를 반환한다', () => {
    saveValue(STORAGE_KEYS.apiKey, 'sk-test');
    expect(loadApiKey()).toBe('sk-test');
  });
});

describe('loadProvider', () => {
  it('저장된 값이 없으면 google이 기본값이다', () => {
    expect(loadProvider()).toBe('google');
  });

  it('저장된 provider를 반환한다', () => {
    saveValue(STORAGE_KEYS.provider, 'anthropic');
    expect(loadProvider()).toBe('anthropic');
  });

  it('알 수 없는 값이면 기본값으로 되돌린다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('openai'));
    expect(loadProvider()).toBe('google');
  });
});

describe('loadHistory', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('깨진 JSON이면 빈 배열을 반환한다', () => {
    localStorage.setItem(STORAGE_KEYS.history, '{broken');
    expect(loadHistory()).toEqual([]);
  });

  it('문자열 배열이 아니면 빈 배열을 반환한다', () => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify([1, 2]));
    expect(loadHistory()).toEqual([]);
  });
});

describe('loadComponents', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('createdAt을 Date로 복원한다', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');
    saveValue(STORAGE_KEYS.components, [
      { id: 'a', prompt: 'p', code: 'c', createdAt: date },
    ]);
    const [restored] = loadComponents();
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.createdAt.getTime()).toBe(date.getTime());
  });

  it('형식이 잘못된 항목은 걸러낸다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: 'a', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
        { id: 'b' },
        null,
      ]),
    );
    expect(loadComponents().map((c) => c.id)).toEqual(['a']);
  });
});

describe('saveValue', () => {
  it('저장소가 예외를 던져도 앱이 죽지 않는다', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(() => saveValue(STORAGE_KEYS.apiKey, 'x')).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
  });
});
