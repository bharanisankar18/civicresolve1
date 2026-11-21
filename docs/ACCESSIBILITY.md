# Accessibility Compliance (WCAG 2.2 AA) - CivicResolve

## 1. Accessibility Commitment

CivicResolve is designed from the ground up for universal access by every citizen, including people using screen readers, keyboard-only navigation, speech input, or high-contrast viewing modes.

---

## 2. WCAG 2.2 Level AA Audit Checklist

| WCAG Criteria                    | Requirement                            | Implementation in CivicResolve                                                                   |  Status  |
| :------------------------------- | :------------------------------------- | :----------------------------------------------------------------------------------------------- | :------: |
| **1.1.1 Non-text Content**       | Alt text for images, icons aria-hidden | All grievance photos have descriptive `alt` tags; decorative icons use `aria-hidden="true"`.     | **PASS** |
| **1.3.1 Info and Relationships** | Semantic HTML, landmarks, headings     | Proper `header`, `nav`, `main`, `footer`, `section`, `h1`-`h4` heading hierarchy.                | **PASS** |
| **1.4.1 Use of Color**           | Never use color alone for status       | Status badges include both an icon and text label (e.g. `Clock + Reported`, `Check + Resolved`). | **PASS** |
| **1.4.3 Contrast (Minimum)**     | Contrast ratio $\ge 4.5:1$             | High-contrast Tailwind palette; tested with WCAG contrast checker.                               | **PASS** |
| **2.1.1 Keyboard**               | Full keyboard operability              | All interactive elements are reachable via `Tab` and activatable via `Enter`/`Space`.            | **PASS** |
| **2.4.1 Bypass Blocks**          | Skip to main content                   | Prominent `<SkipLink />` at the top of every page (`href="#main-content"`).                      | **PASS** |
| **2.4.7 Focus Visible**          | Distinct focus outline                 | Global `focus:ring-2 focus:ring-primary-500 focus:outline-none` on all controls.                 | **PASS** |
| **2.5.5 Target Size**            | Minimum 44×44 px touch targets         | Mobile buttons and controls use `.min-h-touch` (44px) class.                                     | **PASS** |
| **3.2.4 Consistent ID**          | Consistent icons and terminology       | Unified Lucide icons and terminology across all pages and languages.                             | **PASS** |
| **3.3.1 Error Identification**   | Input error messages                   | Form fields link to error text using `aria-describedby` and `aria-invalid="true"`.               | **PASS** |
| **4.1.2 Name, Role, Value**      | Proper ARIA roles and labels           | Accessible modal with focus trap, `role="dialog"`, `aria-modal="true"`.                          | **PASS** |
| **4.1.3 Status Messages**        | Live regions for async changes         | `role="status"` and `aria-live="polite"` announce AI analysis and filter results.                | **PASS** |

---

## 3. Multimodal & Inclusive Features

### Web Speech API (Voice Input)

- Citizens can dictate their problem in **English (`en-IN`)**, **Tamil (`ta-IN`)**, or **Hindi (`hi-IN`)**.
- Speech recognition transcribes spoken words directly into the report field.
- Visual microphone state indicators and audio pulse animations inform the user when the microphone is listening.

### Multilingual Support (i18next)

- Instant language switching between English, Tamil (தமிழ்), and Hindi (हिन्दी).
- Preserves original input text while Gemini normalizes title and category to municipal standards.

### Table Alternatives for Visualizations

- Leaflet map view provides an accessible toggle to display all complaints in an HTML `<table>` with full screen-reader semantic markup.
- Analytics charts include data summaries and tabular representations.
