# Security Specifications - CivicResolve

## 1. Threat Model & Defenses

CivicResolve handles public grievances, municipal administrative controls, and AI interactions. The platform enforces security at every layer:

```
[Client] ---> [Helmet & CORS] ---> [Rate Limiting] ---> [Auth / RBAC] ---> [Zod Validation] ---> [Sharp Sanitization] ---> [DB & AI]
```

---

## 2. Network & Transport Security

- **HTTP Security Headers**: Configured via `helmet`:
  - `Content-Security-Policy` (CSP) restricting script execution and frame embedding.
  - `X-Frame-Options: DENY` preventing clickjacking.
  - `X-Content-Type-Options: nosniff`.
  - `Strict-Transport-Security` (HSTS) with 1-year max-age in production.
- **CORS Allowlist**: Strict origin checking against `CORS_ORIGIN` env var (`http://localhost:5173` in development; production web domain). Rejects untrusted cross-origin requests.
- **CSRF Defense**:
  - Authentication tokens are stored in `httpOnly`, `SameSite: strict`, `secure: true` (in production) cookies.
  - Mutations require custom `Content-Type: application/json` headers which simple HTML form submissions cannot forge cross-origin without triggering preflight.

---

## 3. Rate Limiting

Configured using `express-rate-limit` with IP-based throttling:

- **General API Limiter**: 100 requests per 15-minute window for standard endpoints.
- **Authentication Limiter**: 10 attempts per 15 minutes to protect against brute-force password guessing.
- **AI Analysis Limiter**: 20 requests per 10 minutes to prevent resource exhaustion and abuse of the Gemini API quota.

---

## 4. Authentication & Role-Based Access Control (RBAC)

- **Password Security**: Passwords are cryptographically salted and hashed using `bcrypt` (10 rounds).
- **Session Tokens**: Signed JWTs with user ID, email, role, and expiration (7 days).
- **RBAC Enforcement**: Middleware `requireRole('ADMIN')` guards all administrative mutations:
  - Status updates (`PATCH /api/v1/complaints/:id/status`)
  - Resolution verification (`POST /api/v1/complaints/:id/resolve`)
  - SLA configuration (`PATCH /api/v1/departments/:id/sla`)
  - Unauthorized access yields standard `403 Forbidden` errors with audit logging.
- **Resource Ownership**: Citizens can track any complaint by tracking code (e.g. `CR-2026-XXXX`), but citizen user associations are anonymized on public feeds.

---

## 5. File Upload & Media Sanitization

- **Storage Location**: Stored on disk at `apps/api/uploads` (or Cloud Storage bucket in Cloud Run).
- **Upload Restrictions**:
  - Whitelist: `image/jpeg`, `image/png`, `image/webp`.
  - Max size: 5 MB enforced by Multer.
- **Sharp Image Sanitization**:
  - All uploaded photos are decoded and re-encoded using `sharp`.
  - **EXIF/GPS Metadata is stripped** to protect citizen location privacy before storage.
  - Resized to maximum 1280px dimension to optimize storage and AI tokens.
  - Cryptographically random filenames (UUIDv4) prevent directory traversal and file overwrite attacks.

---

## 6. AI & Prompt-Injection Defense

- **Data Encapsulation**: Citizen inputs are placed inside strict XML-like data boundary delimiters (`<user_observation>...</user_observation>`).
- **Fixed System Instructions**: System instructions instruct the Gemini model to ignore user commands contained within observation tags.
- **Structured Schema Enforcement**: Output is forced to JSON and strictly parsed and validated against `AIAnalysisOutputSchema` using Zod before any field is accepted.
- **Safe Rendering**: React escapes all output by default; no `dangerouslySetInnerHTML` is used in any component.
- **Zero Action Triggering**: Model output never executes actions directly; it only suggests values for the citizen or admin to review and confirm.
