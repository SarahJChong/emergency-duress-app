# CI/CD Workflows

This document provides detailed information about the CI/CD workflows implemented in the Emergency Duress App project.

## Workflow Structure

The project uses two main workflows:

1. Expo App CI (`/.github/workflows/expo.yml`)
2. .NET API CI (`/.github/workflows/api.yml`)

## Expo App CI Workflow

### Trigger Conditions

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - "apps/expo/**"
      - ".github/workflows/expo.yml"
  push:
    branches: [main]
    paths:
      - "apps/expo/**"
      - ".github/workflows/expo.yml"
```

### Jobs

1. **Lint & Type Check**

   - Environment: Ubuntu Latest, Node.js 18
   - Steps:
     - Checkout code
     - Setup Node.js
     - Install dependencies
     - Run ESLint
     - Run TypeScript type checking

2. **Test**

   - Environment: Ubuntu Latest, Node.js 18
   - Steps:
     - Checkout code
     - Setup Node.js
     - Install dependencies
     - Run Jest tests with coverage
     - Upload coverage reports

3. **Build**
   - Environment: Ubuntu Latest, Node.js 18
   - Steps:
     - Checkout code
     - Setup Node.js
     - Install dependencies
     - Build web version
     - Upload build artifacts

### Coverage Requirements

- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## .NET API CI Workflow

### Trigger Conditions

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - "apps/api/**"
      - ".github/workflows/api.yml"
  push:
    branches: [main]
    paths:
      - "apps/api/**"
      - ".github/workflows/api.yml"
```

### Jobs

1. **Build & Test**

   - Environment: Ubuntu Latest, .NET 8.0
   - Steps:
     - Checkout code
     - Setup .NET Core SDK
     - Restore dependencies
     - Build solution
     - Run tests with coverage
     - Upload coverage reports
     - Upload build artifacts

2. **Security Scan**
   - Environment: Ubuntu Latest
   - Uses: GitHub CodeQL
   - Steps:
     - Initialize CodeQL
     - Build project
     - Perform analysis
     - Upload results

## Workflow Best Practices

1. **Path Filters**

   - Workflows only trigger on relevant file changes
   - Prevents unnecessary builds
   - Improves CI/CD efficiency

2. **Caching**

   - Node modules cached between runs
   - NuGet packages cached
   - Faster build times

3. **Artifacts**

   - Test coverage reports retained for 14 days
   - Build artifacts retained for 7 days
   - Enables historical analysis

4. **Security**
   - CodeQL security scanning for .NET
   - Dependency vulnerability checks
   - Secure secret handling

## Common Issues and Solutions

### Expo Build Failures

1. **Node Modules Cache Invalid**
   - Clear GitHub Actions cache
   - Update cache key in workflow
2. **ESLint Errors**
   - Run `npm run lint:fix` locally
   - Update ESLint configuration if needed

### .NET Build Failures

1. **Dependency Resolution**
   - Clear NuGet cache
   - Update package references
2. **Test Failures**
   - Check test coverage requirements
   - Review test environment setup

## Monitoring and Maintenance

### Build Status

- Monitor workflow runs in GitHub Actions
- Review test coverage reports
- Track security scanning results

### Regular Maintenance

1. Update workflow dependencies
2. Review and adjust coverage thresholds
3. Optimize build times
4. Update security scanning rules

## Changelog Validation

The changelog validation workflow (`/.github/workflows/changelog.yml`) ensures that our changelog is consistently maintained:

### Trigger Conditions

```yaml
on:
  pull_request:
    branches: [main]
    paths-ignore:
      - "**.md"
      - "!CHANGELOG.md"
      - "docs/**"
      - ".github/**"
```

### Process

1. **Validation Rules**

   - CHANGELOG.md must be updated for all non-documentation changes
   - Entries must be added under the [Unreleased] section
   - Changes must be categorized under the appropriate subsection:
     - 🎉 Added - New features
     - 🛠 Changed - Changes in existing functionality
     - ⚠️ Deprecated - Soon-to-be removed features
     - 🗑 Removed - Removed features
     - 🐛 Fixed - Bug fixes
     - 🛡 Security - Security fixes

2. **Exemptions**

   - Documentation changes (PR title starts with `doc:` or `docs:`)
   - Dependency updates (Dependabot PRs)
   - CI/CD changes (PR title starts with `ci:`)
   - General chores (PR title starts with `chore:`)

3. **Error Handling**
   - Clear error messages with formatting instructions
   - Links to changelog guidelines
   - Specific section recommendations

## Adding New Workflows

When adding new workflows:

1. Follow existing naming conventions
2. Include appropriate path filters
3. Set up proper caching
4. Configure artifact retention
5. Add security scanning where appropriate
6. Update this documentation
