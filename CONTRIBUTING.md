# Contributing to QuickSewa

First off, thank you for considering contributing to QuickSewa! It's people like you who make this project better for everyone.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project team.

## Getting Started

1. **Fork/Clone the Repository**:
   ```bash
   git clone https://code.swecha.org/VishalBorra/hackathon_30-5-26.git
   cd hackathon_30-5-26
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in the required Supabase and Gemini configurations:
   ```bash
   cp .env.example .env.local
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Commit Message Guidelines

We use **Conventional Commits** to automate our changelog using `git-cliff`. Please format your commit messages as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation changes
* `style`: Styling changes (formatting, etc.)
* `refactor`: Code changes that neither fix a bug nor add a feature
* `perf`: Performance improvements
* `test`: Adding or correcting tests
* `chore`: Maintenance tasks (package updates, CI adjustments, etc.)

### Example
```
feat(auth): add google oauth provider integration
```

## Pull Request Guidelines

* Ensure your code follows the styling rules defined in `biome.json`. Run `npm run lint` before committing.
* Ensure all tests pass. Run `npm run test` to verify.
* Check for dead code or unused files using `npm run knip`.
* Keep pull requests focused on a single concern.
