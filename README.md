# Refind

You see something worth remembering.  
You take a screenshot.  
You move on.

---

A few days pass. The moment you actually need it arrives — and you remember exactly what it was. A receipt. A travel itinerary. A quote that stopped you mid-scroll. You know precisely what you're looking for.

So you open your gallery.

And you scroll.

And you scroll.

And somewhere in the slow, quiet frustration of that search, you realize: **the problem was never the screenshot. It was finding it again.**

---

## This is Refind.

Not a gallery. Not a photo manager.  
A memory, made searchable.

The name is deliberate. You're not discovering something new — you're **refinding** something you already knew. Refind meets you at that moment, the one where the memory is clear but the file is buried, and it gives you back the thing you came for. Instantly.

Type what you remember. Not a date. Not a folder. Just the words — the way you actually think about it. Refind searches the content *inside* your screenshots: the text, the context, the meaning. And it surfaces exactly what you were looking for.

---

## The philosophy.

Every screenshot you take is an act of intention. You paused, you noticed something worth keeping, and you captured it. That moment deserves to be honored — not lost in an infinite grid of thumbnails.

Refind starts from a simple belief: **you should be able to find anything you once chose to remember.**

No cloud. No server. No account.  
Everything is processed and indexed privately, on your device, the moment a screenshot is taken. What you capture belongs entirely to you.

---

## For contributors

### Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification, enforced locally via `husky` and `commitlint`.

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat` | A new feature | Minor bump |
| `fix` | A bug fix | Patch bump |
| `docs` | Documentation changes | — |
| `style` | Formatting, whitespace | — |
| `refactor` | Code restructure, no feature change | — |
| `perf` | Performance improvements | — |
| `test` | Test additions or corrections | — |
| `chore` | Build process or tooling changes | — |

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Releases

Releases are managed automatically by [Release Please](https://github.com/googleapis/release-please).

1. Push `feat` or `fix` commits to `master` — a Release PR is created or updated automatically.
2. The PR bumps the version in `package.json` and `app.json`, and updates `CHANGELOG.md`.
3. Merging the Release PR creates a GitHub Release and tags the commit.
