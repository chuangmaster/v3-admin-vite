<!--
SYNC IMPACT REPORT
==================
Version: 1.2.0 → 1.3.0
Change Type: MINOR (Added Backend API Contract Compliance principle)

Modified Principles:
- MAINTAINED: I. Documentation Language
- MAINTAINED: II. Simplified Architecture
- MAINTAINED: III. Latest Tech Stack
- MAINTAINED: IV. Code Quality & Testing
- MAINTAINED: V. User Experience First
- MAINTAINED: VI. Brownfield Project Protection
- ADDED: VII. Backend API Contract Compliance (new governance principle for frontend-backend separation)

Templates Requiring Updates:
✅ plan-template.md - Constitution check section aligned
✅ spec-template.md - User story requirements aligned (API contract reference)
✅ tasks-template.md - Task categorization aligned (API integration tasks)
✅ checklist-template.md - No updates needed (generic template)
✅ agent-file-template.md - No updates needed (generic template)

Follow-up TODOs: None
-->

# V3 Admin Vite Constitution

## Core Principles

### I. Documentation Language

**All specifications, plans, and user-facing documentation MUST be written in Traditional Chinese (zh-TW)**

- Technical specifications MUST use Traditional Chinese
- Implementation plans MUST use Traditional Chinese
- User guides and documentation MUST use Traditional Chinese
- Code comments SHOULD use Traditional Chinese or English (based on team convention)
- API documentation and README MUST provide Traditional Chinese versions
- Constitution and governance documents MAY use English for broader accessibility

**Rationale**: Ensures team communication consistency, reduces language barriers, improves documentation readability and maintainability.

### II. Simplified Architecture

**Keep architecture simple, avoid over-engineering and complex type gymnastics**

- Do not create unnecessary abstraction layers
- Avoid over-designed patterns
- Code structure should be "just enough," not over-engineered
- Prioritize readability and maintainability over excessive abstraction
- Each file and module MUST have a clear single responsibility

**Rationale**: Lower learning curve, faster development speed, reduced maintenance costs, enables new team members to onboard quickly.

### III. Latest Tech Stack

**All third-party dependencies MUST be kept at the latest stable versions**

- Regularly update all npm packages to latest stable versions
- Use latest Vue 3 Composition API with script setup syntax
- Adopt modern build tools (Vite) and development tools
- Technology selection MUST prioritize ecosystem activity and community support
- MUST run complete tests before each update

**Rationale**: Enjoy latest features and performance improvements, patch security vulnerabilities promptly, maintain project competitiveness.

### IV. Code Quality & Testing

**Ensure code quality and establish reasonable test coverage**

- All code MUST pass ESLint checks
- Critical features and utility functions MUST have unit tests
- Use Vitest for testing
- Code MUST follow unified naming conventions and style guides
- Each configuration item SHOULD have detailed comments explaining purpose

**Rationale**: Reduce bug occurrence, improve code maintainability, ensure refactoring safety.

### V. User Experience First

**Build user-friendly management systems with UX as the core focus**

- Support multiple layout modes (left, top, hybrid)
- Support multiple themes (normal, dark, deep blue)
- Ensure mobile compatibility
- Provide clear error messages and user feedback
- Optimize loading performance and interaction experience
- Implement permission management (page-level and button-level)

**Rationale**: Improve end-user satisfaction, reduce learning costs, increase system adoption rate.

### VI. Brownfield Project Protection

**Prohibit unauthorized modification of existing code unless refactoring is explicitly requested**

- Any modification to existing code MUST obtain explicit consent in advance
- New feature development MUST prioritize extension over modification of existing code
- Refactoring requests MUST clearly explain the scope of changes and impact
- Code changes MUST provide detailed change descriptions
- Maintain consistency with existing architectural style and coding conventions

**Rationale**: Protect existing system stability, reduce destructive change risks, ensure changes are traceable and controllable.

### VII. Backend API Contract Compliance

**All frontend API integrations MUST strictly follow the backend API specification documented in V3.Admin.Backend.API.yaml**

- All API requests MUST use the endpoints, methods, and parameters defined in the OpenAPI specification
- All API responses MUST be handled according to the `ApiResponseModel<T>` format (success, code, message, data, timestamp, traceId)
- Authentication MUST use JWT Bearer Token in Authorization header (except `/api/auth/login`)
- Error handling MUST process all business logic codes defined in the specification (e.g., VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, CONCURRENT_UPDATE_CONFLICT)
- Pagination MUST use standard parameters: pageNumber (starting from 1), pageSize (1-100)
- Request/response data types MUST match the schema definitions exactly
- Do NOT assume or invent API behaviors not documented in the specification
- When API requirements are unclear, reference the specification first before making assumptions

**Rationale**: Ensure frontend-backend contract consistency, prevent integration errors, enable parallel development, maintain API versioning discipline, reduce debugging time from contract mismatches.

## Technical Standards

### Required Tech Stack

- **Frontend Framework**: Vue 3 + TypeScript + Vite
- **UI Framework**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: SCSS + CSS Variables + UnoCSS
- **Code Standards**: ESLint + Prettier
- **Package Manager**: pnpm
- **Testing Framework**: Vitest

### Performance Requirements

- Initial load time < 3 seconds (production)
- Route transition time < 500ms
- Support lazy loading and code splitting
- Optimize bundle size

### Security Requirements

- Implement complete authentication and authorization mechanisms
- Sensitive data MUST NOT be stored in plaintext on frontend
- All API requests MUST include appropriate authentication information
- Prevent common attacks including XSS, CSRF

## Development Workflow

### Commit Convention

MUST follow Conventional Commits specification:

- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `docs`: Documentation and comments
- `types`: Type-related changes
- `test`: Unit test related
- `ci`: Continuous integration, workflows
- `revert`: Revert changes
- `chore`: Chores (update dependencies, modify configs, etc.)

### Code Review

- All changes MUST go through Pull Request review
- Ensure compliance with all constitution principles
- Check code style and comment completeness
- Verify test pass rate

### Quality Gates

- ESLint checks MUST pass (no errors or warnings)
- Related unit tests MUST pass
- Critical feature changes MUST include test cases

## Governance

This constitution serves as the highest guiding principle for project development:

- Any changes violating the constitution MUST explicitly explain rationale in PR
- Complexity increases MUST be thoroughly justified
- Constitution amendments MUST go through team discussion and record decision process
- Version numbers MUST follow Semantic Versioning
- All team members are responsible for maintaining the authority of this constitution

**Version**: 1.3.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-15
