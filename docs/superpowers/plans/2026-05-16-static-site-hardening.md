# Static Site Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the reviewed static-site issues in priority order: text encoding, post rendering safety, generated data size, and validation coverage.

**Architecture:** Keep the existing Node static builder. Generate home/category/post HTML from templates, keep list metadata in generated data, and fetch individual Markdown only after validating the requested source against generated metadata.

**Tech Stack:** Node.js, static HTML templates, browser JavaScript, existing `npm.cmd run validate` and `npm.cmd run build` commands.

---

### Task 1: Validation Coverage

**Files:**
- Modify: `scripts/validate.js`

- [ ] Add validation checks for missing favicon references, mojibake text patterns in source templates/docs, generated-data body bloat, and post source safety.
- [ ] Run `npm.cmd run validate`.
- [ ] Expected before implementation: FAIL on current favicon/mojibake/generated-data behavior.

### Task 2: Encoding Cleanup

**Files:**
- Modify: `build.js`
- Modify: `templates/category.html`
- Modify: `README.md`

- [ ] Replace mojibake editorial copy with readable Korean/English.
- [ ] Run `npm.cmd run validate`.
- [ ] Expected after this task: mojibake checks pass, remaining checks may still fail.

### Task 3: Post Template and Source Allowlist

**Files:**
- Create: `templates/post.html`
- Modify: `build.js`
- Modify: `post.html`

- [ ] Generate `post.html` from a template with consistent metadata, asset versioning, and footer year.
- [ ] In the post page script, allow only sources present in generated metadata.
- [ ] Run `npm.cmd run build`.

### Task 4: Generated Data Slimming

**Files:**
- Modify: `build.js`
- Modify: `templates/post.html`
- Modify: `post.html`

- [ ] Remove full Markdown body embedding from `js/generated-data.js`.
- [ ] Keep post loading via validated Markdown fetch.
- [ ] Run `npm.cmd run validate` and `npm.cmd run build`.

### Task 5: Final Verification

**Files:**
- Inspect all modified files.

- [ ] Run `npm.cmd run validate`.
- [ ] Run `npm.cmd run build`.
- [ ] Report exact command outcomes and modified files.
