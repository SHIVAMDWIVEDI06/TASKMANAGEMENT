================================================================================
  TEAM TASK MANAGER — LOGIN & API CONNECTION AUDIT LOG
  Date: 2026-05-16
================================================================================

1. ISSUES IDENTIFIED & ROOT CAUSES
--------------------------------------------------------------------------------

[CRITICAL] Issue #1: Signup endpoint crashed with "Cannot read properties of undefined"
  File: backend/controllers/authController.js
  Cause: Dead code `const baseURL = import.meta.env.VITE_API_URL` inside signup().
         `import.meta.env` is a Vite construct and does NOT exist in Node.js.
         This threw a TypeError and returned HTTP 500 on every signup attempt.
  Fix: Removed the dead code block.

[CRITICAL] Issue #2: Master admin bypass token was rejected by all protected routes
  File: backend/middleware/auth.js
  Cause: The master admin login (admin@taskmaster.com / admin123) creates a JWT
         with sub="master-admin-id". requireAuth() then called
         User.findById("master-admin-id"), which returns null because this user
         does not exist in the MongoDB collection.
  Fix: Added an explicit check in requireAuth() for payload.sub === "master-admin-id"
         and injected the master admin object directly into req.user.

[HIGH] Issue #3: Double `/api` prefix on all frontend requests when VITE_API_URL unset
  File: frontend/src/services/api.js
  Cause: baseURL fallback was `"/api"`, but every request path already starts with
         `/api/...` (e.g., `/api/auth/me`). When the env var was missing the
         effective URL became `/api/api/auth/me`, hitting the frontend catch-all
         and returning HTML instead of JSON.
  Fix: Changed fallback from `"/api"` to `""` (empty string). Added a Vite dev-proxy
         in vite.config.js so local development proxies `/api` to port 5000.

[HIGH] Issue #4: Navigation race condition after successful login / signup
  Files: frontend/src/pages/Login.jsx, frontend/src/pages/Signup.jsx
  Cause: Both handleSubmit() and a useEffect() watching `user` called navigate().
         This caused a double navigation warning and occasional route flicker.
  Fix: Removed the explicit navigate() calls from handleSubmit() in both files.
         Navigation is now handled exclusively by the useEffect() hook.

[MEDIUM] Issue #5: Missing deleteProject() function in ProjectDetail.jsx
  File: frontend/src/pages/ProjectDetail.jsx
  Cause: The "Yes" confirm-delete button referenced `deleteProject` but the
         function was never declared, causing a runtime ReferenceError.
  Fix: Implemented deleteProject() that calls api.delete(`/api/projects/${id}`)
         and navigates back to /dashboard.

[MEDIUM] Issue #6: Broken member dropdown mappings in task forms
  Files: frontend/src/pages/CreateTask.jsx, frontend/src/pages/TaskDetail.jsx
  Cause: project.members items have shape { user: { _id, name, email }, projectRole }.
         The code was reading m._id, m.name, m.email directly, which are undefined.
  Fix: Updated both selects to read from m.user._id, m.user.name, m.user.email.

[LOW] Issue #7: Ineffective cancelled flag in Taskers.jsx loadData
  File: frontend/src/pages/Taskers.jsx
  Cause: The `cancelled` flag was checked before calling loadData() but loadData()
         is an async closure that doesn't receive the flag. State updates could
         occur after component unmount.
  Fix: Refactored useEffect to inline the async logic so the cancelled flag
         is in the same closure.

================================================================================

2. FILES MODIFIED
--------------------------------------------------------------------------------
  backend/controllers/authController.js    — removed dead VITE_API_URL code
  backend/middleware/auth.js               — added master-admin bypass in requireAuth
  backend/test-api.mjs                     — integration test suite (new)
  frontend/src/services/api.js             — fixed baseURL fallback
  frontend/vite.config.js                  — added /api proxy for dev server
  frontend/src/pages/Login.jsx             — removed duplicate navigate()
  frontend/src/pages/Signup.jsx            — removed duplicate navigate()
  frontend/src/pages/ProjectDetail.jsx     — added missing deleteProject()
  frontend/src/pages/CreateTask.jsx        — fixed member option mapping
  frontend/src/pages/TaskDetail.jsx        — fixed member option mapping
  frontend/src/pages/Taskers.jsx           — fixed cancelled flag scope
  frontend/src/context/AuthContext.jsx     — added token-validation warning log

================================================================================

3. TEST RESULTS (Automated — MongoDB Memory Server)
--------------------------------------------------------------------------------
[PASS] Regular user signup                | status=201
[PASS] Regular user login                 | status=200
[PASS] GET /me with regular token         | status=200
[PASS] Master admin login                 | status=200
[PASS] GET /me with master admin token    | status=200
[PASS] Login with wrong password          | status=401
[PASS] GET /me with invalid token         | status=401
[PASS] GET /me without token              | status=401
[PASS] Duplicate signup rejected          | status=400
[PASS] CORS middleware review             | Allowed origins verified

Frontend build: SUCCESS (vite build completed with 0 errors)

================================================================================

4. MANUAL VERIFICATION CHECKLIST
--------------------------------------------------------------------------------
  [x] POST /api/auth/signup        → 201 + token
  [x] POST /api/auth/login         → 200 + token (regular user)
  [x] POST /api/auth/login         → 200 + token (master admin)
  [x] GET  /api/auth/me            → 200 + user object (regular token)
  [x] GET  /api/auth/me            → 200 + user object (master admin token)
  [x] GET  /api/auth/me            → 401 (no token)
  [x] GET  /api/auth/me            → 401 (bad token)
  [x] Frontend production build    → 0 errors, 0 warnings
  [x] Vite dev proxy configured    → /api routes forwarded to :5000

================================================================================

5. RECOMMENDATIONS FOR FUTURE MAINTENANCE
--------------------------------------------------------------------------------
  • Always keep VITE_API_URL in frontend/.env for local development.
  • Never use Vite-specific globals (import.meta.env) in Node.js backend code.
  • If adding new bypass / special accounts, ensure middleware recognises them.
  • Run `npm run build` before deploying to catch env-related path issues early.
  • Consider adding a GitHub Actions workflow that runs `node backend/test-api.mjs`
    on every pull request to prevent auth regressions.

================================================================================
END OF LOG
================================================================================
