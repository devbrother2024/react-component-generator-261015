# AGENTS.md

## Operational Commands

- 패키지 매니저와 런타임은 bun 고정. npm/yarn/pnpm 사용 금지 (bun.lock 기준).
- `bun install` — 의존성 설치
- `bun run dev` — API 서버(3002) + Vite(5173) 동시 실행
- `bun run server` — API 서버만 실행 (`bun --watch`)
- `bun run test` — vitest 1회 실행 (`src/**`, `server/**` 테스트 모두 포함, jsdom 환경)
- `bun run lint` — eslint
- `bun run build` — `tsc -b && vite build`. 변경 후 완료 보고 전 lint, test, build를 통과시킨다.
- 단일 테스트: `bunx vitest run <파일 경로>`

## Golden Rules

### Immutable

- API 키를 응답 본문, 로그, 에러 메시지로 내보내지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:150-153`).
- `.env`는 커밋하지 않는다 (`.gitignore`). 키는 서버의 `process.env` 또는 클라이언트가 요청 body로 넘긴 값만 쓴다 (`server/index.ts:59-66`).
- 클라이언트 코드(`src/`)에서 AI 프로바이더 API를 직접 호출하지 않는다. 항상 `/api/generate` 프록시를 거친다 (`src/hooks/useComponentGenerator.ts:23`).

### 팀 고유 규칙

- 생성 코드 계약: AI가 만드는 코드는 import 없음, 인라인 스타일, 순수 JavaScript(TS 문법 금지), 마지막에 `render(<X />)` 호출이어야 한다. react-live `noInline` 모드의 제약이며, 어기면 미리보기가 렌더되지 않는다 (`server/index.ts:7-20`, `src/components/LivePreview.tsx:14`, `server/generator.ts:13-15`). `SYSTEM_PROMPT`를 수정할 때 이 규칙을 지운다면 `LivePreview`와 `generator.ts`도 함께 맞춘다.
- 이중 방어 유지: 프롬프트가 "코드펜스 금지", "render 호출 필수"를 지시하지만 서버는 `stripCodeFences`와 `ensureRenderCall`로 한 번 더 보정한다 (`server/index.ts:16,188`, `server/generator.ts:4-24`). 프롬프트가 잘 동작한다고 후처리를 제거하지 않는다.
- 에러 분기는 메시지 문자열의 상태 코드로 한다. 새 프로바이더 호출 함수는 `... error: ${response.status}` 형태로 던져야 503/429가 사용자 친화 메시지로 변환된다 (`server/index.ts:194,201`).
- Google 경로에만 모델 폴백(`withModelFallback`)과 `MAX_TOKENS` 잘림 검사가 있고 Anthropic 경로에는 없다 (`server/index.ts:5,123,134-136` vs `68-96`). 프로바이더 동작을 수정할 때 두 경로의 차이를 의식하고, 의도적 차이인지 확인 없이 한쪽에 맞춰 통일하지 않는다.
- 프록시 포트 3002는 `server/index.ts:139`와 `vite.config.ts:11`에 중복 정의돼 있다. 한쪽만 바꾸지 않는다.
- Google API 호출 URL에 키가 쿼리스트링으로 들어간다 (`server/index.ts:99`). 이 URL이나 fetch 에러 객체를 로깅하지 않는다.

### 테스트 경계

- 테스트가 있는 곳: 순수 함수(`server/generator.test.ts`, `server/fallback.test.ts`)와 `src/components/PromptInput.test.tsx`. 서버 로직은 부수효과 없는 모듈로 분리해 테스트하는 방식이다 (`server/generator.ts:1-2`).
- 테스트가 없는 곳: `server/index.ts`(Bun.serve 핸들러, 프로바이더 호출), `src/App.tsx`, `src/hooks/useComponentGenerator.ts`. 이 영역을 고칠 때는 로직을 순수 함수로 빼서 테스트를 추가하는 쪽을 우선한다.

## Project Context

- 프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 보여주는 도구.
- Stack: React 19, TypeScript, Vite, react-live, Bun(API 서버), vitest, Testing Library.
- 설치/실행/기능 설명은 `README.md` 참고.

## Standards & References

- 커밋: `<type>: <한국어 요약>`, type은 feat, fix, refactor, chore. `.claude/skills/commit/SKILL.md` 규칙을 따른다.
- 사용자 대상 문구와 주석은 한국어로 쓴다 (기존 코드 관례).
- 서버 전용 규칙은 `server/AGENTS.md` 참고.

## Maintenance Policy

- 이 파일의 규칙과 코드가 어긋나면(경로, 라인, 포트, 명령어 변경 등) 작업을 마칠 때 업데이트를 제안한다.
