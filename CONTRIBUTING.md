# Contributing to VeloxAPI

Thank you for your interest in contributing to VeloxAPI! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/VeloxAPI.git
   cd VeloxAPI
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run tests** to ensure everything works
   ```bash
   npm test
   ```

## 🛠️ Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Write clean, readable code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed

### 3. Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new feature"
```

**Commit message format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test updates
- `refactor:` - Code refactoring
- `perf:` - Performance improvements

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

## 📋 Contribution Guidelines

### Code Style
- Use **JavaScript** (no TypeScript in source code)
- Follow existing code patterns
- Keep files small and focused
- Use meaningful variable names
- Add comments for complex logic

### Testing Requirements
- All new features must have tests
- Maintain 95%+ test coverage
- Tests should be in appropriate directories:
  - `tests/unit/` - Unit tests
  - `tests/integration/` - Integration tests
  - `tests/smoke/` - Smoke tests

### Documentation
- Update README.md if adding new features
- Add examples to `examples/` directory
- Update tutorials in `learn/` if needed
- Keep docs clear and beginner-friendly

### Zero Dependencies Rule
- **Production code must have ZERO dependencies**
- Only use Node.js built-in modules
- Dev dependencies are allowed for testing

## 🐛 Reporting Bugs

1. Check if the bug is already reported in Issues
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Node.js version and OS
   - Code example if applicable

## 💡 Feature Requests

1. Check existing issues for similar requests
2. Open a new issue describing:
   - The problem it solves
   - Proposed solution
   - Any alternatives considered
   - Impact on existing features

## 🎯 Priority Areas

We're especially interested in contributions for:

### Performance
- Benchmarking against other frameworks
- Memory optimization
- Request/response performance

### Features
- Static file middleware with ETag
- Rate limiting
- Request validation (JSON schema)
- Compression (gzip/brotli)

### Documentation
- More examples
- Tutorial improvements
- API documentation
- Performance guides

## ⚡ Performance Considerations

When contributing, keep performance in mind:
- Avoid unnecessary allocations
- Use streaming for I/O operations
- Minimize synchronous operations
- Profile changes with benchmarks

## 🧪 Running Benchmarks

```bash
# Coming soon - benchmarking suite
npm run benchmark
```

## 📝 Code Review Process

1. All PRs require review before merging
2. Maintainers will review for:
   - Code quality
   - Test coverage
   - Performance impact
   - Documentation
3. Address review feedback
4. Once approved, your PR will be merged

## 🙏 Recognition

Contributors will be:
- Added to `package.json` contributors list
- Mentioned in release notes
- Listed in CONTRIBUTORS.md (coming soon)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open a GitHub Discussion
- Check existing documentation in `docs/`
- Review tutorials in `learn/`

---

Thank you for contributing to VeloxAPI! 🚀
