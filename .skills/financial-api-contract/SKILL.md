---
name: financial-api-contract
description: Trace and verify API data contracts between this dashboard's FastAPI backend and React/TypeScript frontend. Use when changing or debugging an API route, response model, fetcher, financial type, or API-driven calculation.
---

# Financial API Contract

## Objective

Keep the dashboard's API boundary accurate and testable by tracing data from the FastAPI response model through the TypeScript consumer and its calculations. TypeScript annotations do not validate `response.json()` at runtime. Do not introduce a schema generator, client library, or endpoint migration unless the task requires it.

## Inputs

- The endpoint, behavior, or failure being changed. If none is specified, use the API path touched by the current task.
- The FastAPI route signature and `response_model` in `backend/app/routes.py`.
- The frontend fetcher, consumer, related type, and calculations in `frontend/src/`.
- Existing backend, Vitest, and browser tests relevant to that path.
- Vite proxy and `VITE_API_BASE_URL` configuration when request routing is involved.

Discover these inputs from the repository; do not assume a provided TypeScript type proves the server payload is valid.

## Expected Output

For an investigation or review, return:

1. A compact contract trace: HTTP method/path, query parameters and constraints, response model/fields, frontend consumer and transformation, and tests covering the path.
2. The concrete mismatch or risk, with repository file references. If no mismatch is found, state that and do not invent one.
3. The smallest actionable change and the exact checks that would verify it.

For an implementation task, make only the requested contract change, add or update a focused regression test at the boundary being changed, and report the commands and outcomes.

## Workflow

1. Read applicable repository guidance and inspect the route's `response_model`, parameter defaults, and validation constraints.
2. Follow the request into the frontend: fetch URL and query encoding, JSON handling, TypeScript types, and any KPI/chart transformations.
3. Check Vite proxy and environment configuration only when they affect the request path. Do not infer deployed configuration from local Docker settings.
4. Compare actual server payload behavior with frontend assumptions. Distinguish compile-time types from runtime validation; add runtime parsing only when required by the task or when malformed payloads can cause an identified failure.
5. Reuse existing tests and patterns. Prefer backend route tests for server behavior, Vitest for parsing/calculation behavior, and `npm --prefix frontend run test:a11y` for user-visible loading/error states. Do not claim mocked browser responses prove backend/frontend schema alignment.
6. Keep scope limited to the affected endpoint. Do not wire unused endpoints, duplicate calculations, add dependencies, or create generated types as speculative cleanup.

## Acceptance Criteria

- The route, response fields, query parameters, frontend consumer, and current test coverage are identified from source, not inferred.
- Any changed request or response assumptions are covered by a focused regression test; runtime JSON validation is not credited to TypeScript alone.
- The selected check matches the change: backend tests for route behavior, frontend tests for client parsing/calculation, and browser tests only for affected UI behavior.
- The relevant commands are run and their result is reported; if blocked, the exact blocker is reported instead.
- No unrelated endpoint, dashboard layout, dependency, or architecture change is included.