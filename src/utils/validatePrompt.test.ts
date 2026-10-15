import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('500자 이하이면 유효하다', () => {
    const result = validatePrompt('a'.repeat(MAX_PROMPT_LENGTH));
    expect(result).toEqual({ valid: true, length: 500 });
  });

  it('500자를 넘으면 유효하지 않고 에러 메시지를 반환한다', () => {
    const result = validatePrompt('a'.repeat(MAX_PROMPT_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.length).toBe(501);
    expect(result.error).toContain('500');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const result = validatePrompt(`  ${'a'.repeat(MAX_PROMPT_LENGTH)}  `);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(500);
  });
});
