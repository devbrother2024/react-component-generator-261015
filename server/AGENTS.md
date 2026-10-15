# server/AGENTS.md

## Module Context

Bun 런타임에서 도는 AI 프로바이더 프록시. `index.ts`가 HTTP 진입점이고, 순수 로직은 `generator.ts`와 `fallback.ts`로 분리돼 있다.

## Tech Stack & Constraints

- Bun 전용 API(`Bun.serve`, `process.env`) 사용. 외부 HTTP 클라이언트 라이브러리 없이 전역 `fetch`만 쓴다 (`index.ts:69,101`).
- 모든 응답에 `CORS_HEADERS`를 붙인다. 새 라우트나 에러 응답에서도 빠뜨리지 않는다 (`index.ts:51-55`).
- 요청 body 키는 `{ prompt, apiKey?, provider? }`. `provider` 기본값은 `anthropic` (`index.ts:161`).

## Implementation Patterns

- 새 프로바이더 추가: `Provider` 유니온(`index.ts:57`)과 `ENV_KEYS`(`index.ts:59`)에 항목 추가, `call<Provider>` 함수 작성, `/api/generate`의 분기(`index.ts:183-186`) 수정, 클라이언트 `src/types/index.ts`의 `Provider`와 `src/App.tsx:8`의 `PROVIDER_CONFIG`도 맞춘다.
- 모델 우선순위 변경은 `GOOGLE_MODELS` 배열 순서로 한다. 앞 모델 실패 시 다음 모델로 넘어가고 모두 실패하면 마지막 에러를 던진다 (`fallback.ts:12-19`).
- 응답 후처리는 `ensureRenderCall(stripCodeFences(text))` 순서를 지킨다 (`index.ts:188`).

## Testing Strategy

- 테스트 실행: `bunx vitest run server`
- 테스트는 부수효과 없는 모듈(`generator.ts`, `fallback.ts`)에 대해서만 작성돼 있다. `index.ts`에 로직을 추가하기보다 별도 모듈로 분리하고 `*.test.ts`를 같은 폴더에 둔다.

## Local Golden Rules

- Do: 새 에러 경로를 만들 때 상태 코드를 메시지에 포함한다. `message.includes('503'|'429')`로 분기하기 때문이다 (`index.ts:194,201`).
- Do: `fallback.ts`의 `withModelFallback`은 빈 모델 배열에서 즉시 에러를 던진다 (`fallback.ts:7-9`). 이 동작을 유지한다.
- Don't: Google 요청 URL(키 포함, `index.ts:99`)이나 raw 에러 객체를 `console.log`로 출력하지 않는다.
- Don't: `/api/config`에 키 값 자체를 담지 않는다 (`index.ts:150-153`).
- Don't: `SYSTEM_PROMPT`(`index.ts:7-49`)의 "import 금지 / render 호출 / JS only" 규칙을 완화하지 않는다. 클라이언트 `react-live` 렌더링이 깨진다.
