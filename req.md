
You are an expert full-stack developer. Build a **Google Sheets + Google Apps Script (backend) + Vanilla HTML/CSS/JS (frontend)** project named **ATF Showcase**. Follow these instructions exactly.

## 1) Tech constraints (very important)

* **Frontend:** Only vanilla **HTML, CSS, JS**. No frameworks/libraries (no React, no jQuery, no Bootstrap).
* **Styling:** Clean, modern, **blue + white** professional UI. Fully **responsive** (mobile → desktop). Smooth micro-interactions (hover, focus, active) and accessible contrast.
* **Code Language Rule:** All **code, variables, functions, comments in English** only.
* **Backend:** **Google Apps Script** connected to a **Google Sheet**. Provide REST-like web app endpoints (JSON).
* **Storage:** Data in Google Sheets; images in **Google Drive** folder id: `1jQIWqzcCGcrkZx_wB1mScl7RhpaHR6Bv`.
* **Config:** Frontend must read **env/config.txt** at runtime to get `APP_SCRIPT_URL` (Web App /exec) and `DRIVE_FOLDER_ID`. Don’t hardcode URLs anywhere else.

## 2) Folder structure (must match)

```
ATF_Showcase/
├─ index.html                       (routes to user UI)
├─ shared/
│  ├─ css/base.css                  (resets, tokens, typography)
│  └─ js/config.js                  (reads env/config.txt → exports APP_SCRIPT_URL, tokens)
├─ user/
│  ├─ index.html                    (public showcase)
│  ├─ css/styles.css
│  ├─ js/app.js                     (boot, events)
│  ├─ js/api.js                     (public fetch helpers)
│  └─ js/components/                (Card, Modal, Pagination, Filters)
├─ admin/
│  ├─ index.html                    (admin panel: sidebar + content)
│  ├─ css/styles.css
│  ├─ js/app.js                     (state, auth guard, nav)
│  ├─ js/api.js                     (secured fetch helpers)
│  ├─ js/validators.js              (required fields, URL checks)
│  └─ js/components/                (cards, tables, modals, progress bars, toasts)
├─ env/
│  └─ config.txt                    (APP_SCRIPT_URL, DRIVE_FOLDER_ID, colors)
└─ sheets/                          (reference CSVs for Sheet setup – provided)
```

## 3) Google Sheet design (tabs & columns)

Create a Google Spreadsheet with these tabs:

1. **Admin-info**

* Columns: `USERNAME`, `PASSWORD`
* Use **plain text placeholders** (admin can change later). Server will validate login.

2. **Categories**

* Columns: `S.NO`, `CATEGORY-NAME`, `DATE`, `TIME`
* On new category create: append row with next serial, today’s date (`YYYY-MM-DD`) and time (`HH:mm:ss` IST).

3. **Master_Template** (used as style for all category sheets)

* Columns: `S.NO`, `WEB IMAGE`, `WEB NAME`, `DESCRIPTION`, `URL`, `CATEGORY`, `DATE`, `TIME`

**When a category is added**, create a **new sheet** named exactly as the category, by **copying Master_Template** (same headers & styles).
All website entries for that category are stored in that sheet.

> Sorting rule (both admin & user sides): list must always show **latest first**, where “latest” means newest by combined **DATE + TIME** (either newly created or last edited).

## 4) Data rules & validation

* **URL format:** must be a proper URL (enforce `https://` automatically if user types `google.com`).
* **Description:** card shows limited height with internal scroll; clicking “Read more” opens a modal.
* **Search:**

  * Admin “Web List” → start filtering at **3 characters**.
  * User “Showcase” → start filtering at **2 characters**.
  * Search across **WEB NAME, DESCRIPTION, CATEGORY, URL** (case-insensitive).
* **Filters:** Date range (calendar), Category dropdown. Combine with search (AND logic).
* **Pagination:** **12 cards per page**.
* **Timestamps:** On **create** and **edit**, update `DATE` and `TIME` to current values so the edit also bubbles the item to top in “latest first”.

## 5) Images & Google Drive behavior (critical)

* Drive folder id: `1jQIWqzcCGcrkZx_wB1mScl7RhpaHR6Bv`.
* In **Add Entry** and **Edit**:

  * **Add Entry:** Only **commit** the image to Drive on **final Submit**. Until then, just preview locally; show **real upload progress** during form submit using XHR `upload.onprogress`.
  * **Edit:** If image is replaced, **upload new**, then **delete old** by its stored file id/URL.
* **Sheet storage for image:** Save **file id or public URL** in `WEB IMAGE` column.
* On **Delete Entry:** also delete its Drive image (if exists), then remove the row.

## 6) Backend (Google Apps Script) endpoints (JSON)

Implement a GAS Web App (`doPost`/`doGet`) with these routes (via `action` parameter or path routing). All responses: `{ success: boolean, message: string, data?: any }`.

**Auth**

* `POST /auth/login` → body: `{ username, password }` → validates from `Admin-info`.
  Returns `{ token, expiresAt }`. Use a simple signed token (e.g., Utilities base64 + checksum) or temporary UUID stored in Cache/Properties.
* `POST /auth/verify` → header `Authorization: Bearer <token>` → returns success if valid.
* `POST /auth/logout` → invalidates token.

**Categories (secured)**

* `GET /categories/list`
* `POST /categories/create` → `{ name }`

  * Append to “Categories” tab (next S.NO, date, time).
  * Create a **new sheet** (copy of “Master_Template”) named exactly `name`.
* `POST /categories/update` → `{ originalName, newName }` (rename sheet and update “Categories” row)
* `POST /categories/delete` → `{ name }` (delete that category sheet and row)

**Entries**

* **Public:**

  * `GET /entries/publicList` → returns **merged** latest entries across **all category sheets**, sorted by `DATE+TIME` desc, paginated (page,size), with server-side filtering (search, date range, category).
* **Admin (secured):**

  * `GET /entries/list` (same as public but includes extra admin fields if needed)
  * `POST /entries/create` with multipart/form-data: fields `{ name, category, url, description }` + file `{ image }`

    * On success: write to that category’s sheet; set `S.NO` (next), `DATE`, `TIME`; upload image; store file id/URL in `WEB IMAGE`.
  * `POST /entries/update` → `{ sheetName, rowSerial, updates (name/url/description/category), optional new image }`

    * If category changed: move row to new sheet; maintain serials; update timestamps.
  * `POST /entries/delete` → `{ sheetName, rowSerial, imageFileId }` → delete Drive file then remove row.

**Images**

* **Handled inside** create/update/delete endpoints to ensure “commit on submit” behavior for Add Entry.
* For **Edit** replacement: accept image, upload, then delete old by id.

**Utilities**

* All list endpoints accept: `search`, `startDate`, `endDate`, `category`, `page`, `size` (size default 12).

## 7) Admin UI (left sidebar + views)

**Sidebar (collapsible/expandable):**

* Sections: **Dashboard**, **Web List**, **Add Entry**, **Add Category**, **Logout**.
* Clicking a section updates right-pane view (no page reload).

**Dashboard view:**

* Show **Total Websites** and **Total Categories** (big numbers).
* A small bar/line **graph** visualizing entries per category (simple canvas chart coded vanilla or SVG; no external libs).

**Web List view:**

* Top row: **Search** (3+ chars, real-time), **Date range filter** (calendar), **Category filter**.
* Below: **Grid of 12 cards/page**. Each card:

  * **Image** (fit cover)
  * **Title (WEB NAME)**
  * **Category** (badge)
  * **Description** (fixed height with inner scroll; click → modal opens with full text)
  * Bottom left: **Visit Site** (opens new tab)
  * Bottom right: **Edit** and **Delete** buttons
* **Delete** → confirmation modal (“Are you sure?”) → on OK, remove entry & Drive image.
* **Edit** → modal with full form to change fields & optionally replace image (with upload progress).
* **Pagination** controls at bottom.

**Add Entry view:**

* Form fields: **Web Name**, **Category (dropdown)** *(only if categories exist; else show “No categories yet” state)*, **URL**, **Description**, **Image choose/remove**.
* **Progress bar + %** during final submit upload; **error message** if upload fails.
* **Reset Form** button and **Submit** button (commit to sheet + Drive).

**Add Category view:**

* Category add form (single input).
* Below: table/list of existing categories with **Edit** (rename) and **Delete** (with confirm).

**Logout:**

* On click, show confirm (“Do you want to logout?”). **Yes** → clear token & redirect to showcase. **No** → cancel.

**Floating refresh icon (top-right in Admin):**

* Clicking refreshes data (re-fetch lists) **without** hard page reload.

## 8) User (Showcase) UI

Top bar: **Logo (left)** + **ATF-SHOWCASE (right)**.
Filter row: **Search (2+ chars, live)**, **Date filter (calendar)**, **Category filter**.
Grid of cards (same style as admin but **no edit/delete**).
Cards use same **latest first** sorting and **12/page** pagination.
Right side: a **floating icon** that opens an **Admin Login modal** (username/password). Modal includes a “**Back to Showcase**” link.

**Footer:** “Owned by Art-Tech Fuzion · Design by Art-Tech Fuzion”.

## 9) Auth & security

* On login success, store token in `sessionStorage`.
* Every secured admin request sends header `Authorization: Bearer <token>`.
* If verify fails, redirect to login modal.
* Do not expose secrets in client. Keep GAS code validating token properly.

## 10) UX & visual design

* Color tokens from env/config.txt (e.g., `PRIMARY_COLOR=#0B5FFF`, `SECONDARY_COLOR=#FFFFFF`).
* Clean typography, adequate spacing, smooth focus states, keyboard accessible modals and controls.
* Buttons: rounded, subtle shadows, clear disabled states.
* Toast messages for success/error (create/update/delete).
* Empty states with helpful copy (e.g., “No categories yet”).

## 11) Performance & quality

* Lazy image loading.
* Debounce search (250ms).
* Client-side caching of last results; hard refresh icon to re-pull.
* Defensive programming: handle network errors, Drive failures, and validation issues with friendly messages.
* Code split across small modules in `/js/components`.
* Lint-like cleanliness; meaningful names; comments explaining non-obvious logic.

## 12) Acceptance tests (must pass)

1. Create 3 categories → verify 3 new sheets created (copied from Master_Template).
2. Add 15 entries spread across categories → verify **12/page** and sorting “latest first”.
3. Edit an older entry → timestamp updates; entry appears at top; image replacement deletes old file.
4. Delete an entry → row removed + Drive file deleted.
5. User showcase: live search (2 chars), date & category filter + pagination.
6. Admin web list: live search (3 chars), date & category filter + pagination.
7. Add Entry: upload progress appears; cancel/reset does **not** leave orphan files in Drive; only final submit commits file.
8. Logout confirm works; token invalidated; login modal accessible via floating icon.
9. Footer shows correct credits; layout is responsive across mobile/tablet/desktop.
10. env/config.txt is read at runtime; no hardcoded URLs.

---

## Kya mila zip ke andar?

* **/sheets/Admin-info.csv**, **/sheets/Categories.csv**, **/sheets/Master_Template.csv** (Sheet templates)
* **/env/config.txt** (sample; bas `APP_SCRIPT_URL` replace karna)
* **/project_structure.txt** (tree)
* **/README-setup.txt** (quick setup steps)