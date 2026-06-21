# Refind

Refind is a high-precision OCR and FTS search engine for screenshots.

## Development

### Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This is enforced locally via `husky` and `commitlint`.

**Common Types:**
- `feat`: A new feature (triggers a **minor** version bump)
- `fix`: A bug fix (triggers a **patch** version bump)
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Format:**
```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Releases

Releases are managed automatically by [Release Please](https://github.com/googleapis/release-please). 
1. When you push `feat` or `fix` commits to the `master` branch, a Release PR will be automatically created or updated.
2. The Release PR will bump the version in `package.json` and `app.json`, and update the `CHANGELOG.md`.
3. Merging the Release PR will create a GitHub Release and tag the commit.
