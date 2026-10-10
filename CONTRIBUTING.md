# Contributing to Refind

Thank you for your interest in contributing to **Refind**! Refind is an open-source, 100% on-device screenshot search engine built for privacy and speed.

We welcome contributions of all kinds: bug fixes, documentation improvements, UI enhancements, and performance optimizations.

---

## 🔒 The Core Privacy Rule

Refind has a fundamental architectural promise:
> **Zero Cloud. Zero Server. Zero Telemetry.**

Every feature, stage, and improvement **must process data locally on the user's device**. We do not accept contributions that introduce:
- Third-party tracking or analytics SDKs
- External cloud transmission of user photos, extracted OCR text, or search queries
- Unnecessary background network requests

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: `22.x` or later
- **pnpm**: `v9` or `v10` (`corepack enable pnpm`)
- **JDK**: Java 17
- **Android SDK**: Android API 34+ and NDK installed (for local native builds)

### Getting Started

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/refind.git
   cd refind
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm start
   # Or with remote tunnel:
   pnpm dev:tunnel
   ```

4. **Compile a local APK**:
   ```bash
   pnpm compile:apk --debug
   ```

### 🏗️ Local Builds vs. EAS Cloud Builds

* **Local Builds (Recommended)**: You do **not** need an Expo account or EAS credentials to build and test Refind. Running `pnpm compile:apk --debug` or `pnpm android:dev` generates the native Android project via `expo prebuild` and compiles the APK locally with Gradle.
* **EAS Cloud Builds (For Forks)**: The `owner` (`"tanay22"`) and `extra.eas.projectId` in [`app.json`](app.json) belong to the upstream Refind deployment. If you wish to run cloud builds using EAS on your personal fork:
  1. Install EAS CLI: `pnpm add -g eas-cli`
  2. Run `eas init` to link your personal Expo account and generate a new project ID.

---

## 📝 Commit Convention

Refind follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification, enforced via `husky` and `commitlint`.

This is critical because our automated release engine ([Release Please](https://github.com/googleapis/release-please)) parses commit messages to bump semantic versions and generate `CHANGELOG.md`.

### Allowed Types

| Type | When to Use | SemVer Bump |
|---|---|---|
| `feat` | A new feature or user-visible capability | **Minor** (`0.x.0`) |
| `fix` | A bug fix | **Patch** (`0.0.x`) |
| `docs` | Documentation updates (README, docs) | None |
| `style` | Formatting, whitespace changes | None |
| `refactor` | Code refactoring without changing behavior | None |
| `perf` | Code changes that improve performance | Patch / None |
| `test` | Adding or updating tests | None |
| `chore` | Tooling, CI/CD, dependency updates | None |

### Format
```text
<type>(<scope>): <short description in present tense>

[optional body explaining rationale]

[optional footer(s) like "Closes #123"]
```

**Examples:**
* `feat(search): add fuzzy matching fallback for OCR typos`
* `fix(viewer): prevent zoom reset when tapping copy button`
* `docs(readme): clarify JDK 17 requirement`

---

## 🧪 Pre-Submission Checklist

Before creating a Pull Request, please ensure the following commands run cleanly:

```bash
# 1. Type check TypeScript
pnpm type-check

# 2. Run ESLint
pnpm lint

# 3. (Optional) Auto-fix linting issues
pnpm lint:fix
```

---

## 🚀 Pull Request Workflow

1. Create a feature branch off `master`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Make your changes and commit using Conventional Commits.
3. Push to your fork and submit a Pull Request to `tanay-787/refind:master`.
4. Fill out the PR template with a clear explanation of what changed and how it was tested.
5. Once merged into `master`, Release Please will automatically include your changes in the next release draft!
