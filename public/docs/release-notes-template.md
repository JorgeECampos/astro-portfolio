# Release Notes – Version {{version}}
**Release Date:** {{date}}

---

## 📌 Summary
A high-level overview of what this release includes.

- Feature improvements
- Bug fixes
- API updates
- Dependency updates

---

## 🚀 New Features
List new functionality introduced in this release.
- feat: Added tax calculation endpoint
- feat: Implemented invoice export (PDF/CSV)

---

## 🛠 Improvements
`refactor:` / `perf:` / `chore:` changes.

- refactor: Optimized reporting service
- chore: Updated CI pipeline dependencies


---

## 🐛 Bug Fixes
Fixes grouped by subsystem or service.

- fix: Double-charge bug in payment flow (#421)
- fix: Corrected timezone issue in scheduler (#430)


---

## 💥 Breaking Changes
Only needed if the release requires migrations or compatibility updates.

- BREAKING: Removed /v1/user endpoint (use /v2/user)
- Updated JWT claims structure for authentication


---

## 🔄 API Changes
Document all API-level modifications.

| Endpoint | Change | Notes |
|----------|--------|-------|
| `GET /v2/taxes/{id}` | Modified | Added `region` parameter |
| `POST /v2/users` | New | Replaces deprecated v1 endpoint |

---

## 🔐 Security Validation
Include automated checks (copy/paste from CI pipeline):

- Dependency audit: ✔ Passed  
- SAST (Static Analysis): ✔ Passed  
- Secrets scan: ✔ Passed  
- Vulnerability scan: ✔ Passed  
- API schema validation: ✔ Passed  

(Optional):  
**Link to full validation report:** `{{security_report_url}}`

---

## 🧪 QA Validation
Status of QA testing for the release:

| Test Type | Status | Notes |
|-----------|--------|-------|
| Regression Suite | ✔ Completed | 412 automated tests |
| Smoke Tests | ✔ Completed | All critical flows passed |
| Exploratory Testing | ✔ Completed | Checklist attached |
| API Contract Tests | ✔ Passed | Machine-validated |

Attach files if needed:
👉 `{{qa_report_url}}`

---

## 📦 Dependency Updates
List all updated libraries:
- updated: axios 0.21.1 → 1.2.3
- updated: lodash 4.17.15 → 4.17.21
- updated: dayjs 1.10 → 1.11


---

## 🧵 Related Tickets
Reference any linked work:

- INC-1201 – Tax calculation upgrade
- INC-1190 – Scheduler timezone fix
- QA-554 – Session handling regression tests


---

## ⏪ Rollback Instructions
Step-by-step rollback procedure:

1. Checkout tag v{{previous_version}}
2. Revert database migrations using rollback scripts
3. Redeploy with stable configuration
4. Verify with smoke test suite


---

## 📝 Changelog (Auto-Generated)
Generated from commit history:
{{commits}}


---

## 📎 Additional Notes
Add any relevant context such as:
- Partner notifications  
- Required migrations  
- Configuration changes  
- Feature flags toggled  
