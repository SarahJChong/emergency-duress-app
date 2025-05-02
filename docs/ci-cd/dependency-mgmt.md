# Dependency Management

This document outlines how dependencies are managed in the Emergency Duress App project using Dependabot.

## Overview

We use GitHub's Dependabot to automate dependency updates across our project. This helps us:

- Keep dependencies secure and up-to-date
- Reduce manual update overhead
- Ensure consistent dependency management
- Automatically create PRs for updates

## Configuration

Our Dependabot configuration (`.github/dependabot.yml`) manages three types of dependencies:

### 1. Expo App (npm)

```yaml
- package-ecosystem: "npm"
  directory: "/apps/expo"
  schedule:
    interval: "weekly"
    day: "monday"
    time: "09:00"
    timezone: "Australia/Perth"
  groups:
    dependencies:
      patterns:
        - "*"
  open-pull-requests-limit: 10
  labels:
    - "dependencies"
    - "expo"
```

### 2. .NET API (NuGet)

```yaml
- package-ecosystem: "nuget"
  directory: "/apps/api"
  schedule:
    interval: "weekly"
    day: "monday"
    time: "09:00"
    timezone: "Australia/Perth"
  groups:
    dependencies:
      patterns:
        - "*"
  open-pull-requests-limit: 10
  labels:
    - "dependencies"
    - "api"
```

### 3. GitHub Actions

```yaml
- package-ecosystem: "github-actions"
  directory: "/"
  schedule:
    interval: "weekly"
    day: "monday"
    time: "09:00"
    timezone: "Australia/Perth"
  groups:
    github-actions:
      patterns:
        - "*"
  labels:
    - "dependencies"
    - "github-actions"
```

## Update Process

### Automated Updates

1. Dependabot checks for updates every Monday at 9:00 AM AWST
2. Creates PRs for any available updates
3. Groups related dependencies together
4. Applies relevant labels
5. Assigns team reviewers

### Review Process

1. CI runs on dependency update PRs
2. Team reviews the changes
3. Check for breaking changes
4. Verify tests pass
5. Review changelog/release notes

### Merge Guidelines

#### Auto-merge Criteria

- Patch version updates
- All tests pass
- No breaking changes
- Security updates

#### Manual Review Required

- Major version updates
- Breaking changes
- Complex dependency trees
- Performance impacts

## Version Policies

### Semantic Versioning

We follow semantic versioning principles:

- **Major** (x.0.0): Breaking changes
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

### Update Priorities

1. Security updates (immediate)
2. Bug fixes (high priority)
3. Feature updates (normal priority)
4. Breaking changes (planned)

## Troubleshooting

### Common Issues

1. **Conflicting Dependencies**

   - Review package.json/packages.config
   - Check version constraints
   - Resolve peer dependencies

2. **Failed Updates**

   - Check CI logs
   - Review breaking changes
   - Test locally before merging

3. **Version Conflicts**
   - Use version resolution
   - Update related packages
   - Check compatibility matrix

## Best Practices

1. **Regular Maintenance**

   - Review pending updates weekly
   - Keep dependencies current
   - Monitor security advisories

2. **Testing**

   - Run full test suite
   - Check for deprecation warnings
   - Verify functionality

3. **Documentation**

   - Update changelog
   - Document breaking changes
   - Update dependency lists

4. **Security**
   - Priority for security patches
   - Review vulnerability reports
   - Keep lockfiles updated

## Manual Updates

For cases where manual updates are needed:

### Expo App

```bash
cd apps/expo
npm update           # Update within version constraints
npm outdated         # Check for available updates
npm audit            # Security audit
```

### .NET API

```bash
cd apps/api
dotnet restore       # Restore packages
dotnet list package --outdated  # Check for updates
dotnet list package  # List current packages
```

## Monitoring and Reports

### Available Tools

1. **GitHub Security Tab**

   - Dependency graph
   - Security alerts
   - Dependabot alerts

2. **npm/NuGet Reports**
   - Audit reports
   - Outdated packages
   - Security advisories

### Regular Reviews

- Weekly dependency status review
- Monthly security assessment
- Quarterly major update planning
