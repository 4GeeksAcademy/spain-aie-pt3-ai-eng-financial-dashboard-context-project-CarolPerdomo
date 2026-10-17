# Skills

- Discovery: `npx skills find performance` surfaced React performance and web performance skills; `npx skills find testing` surfaced browser-testing options.
- Applied: `anthropics/skills@webapp-testing`, installed at `.agents/skills/webapp-testing`.
- Rationale: this React financial dashboard already has a Playwright browser harness covering loading, empty and error states, responsive layouts, keyboard interactions, and axe checks. The web-app testing skill directly supports verifying those user-visible flows without adding test dependencies or speculative code changes.
- Verification: `npm --prefix frontend run test:a11y` passed at 1440px and 390px; text contrast was 5.18:1 and chart focus contrast was 4.69:1.