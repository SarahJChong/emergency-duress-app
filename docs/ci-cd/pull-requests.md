# Pull Request Guidelines

This document outlines the pull request process and requirements for the Emergency Duress App project.

## Pull Request Process

### 1. Preparation

Before creating a pull request:

- Ensure all tests pass locally
- Update documentation if needed
- Run linting checks
- Review the changes for security implications
- Verify the build succeeds

### 2. Creating the PR

1. Use the [PR template](/.github/pull_request_template.md) provided
2. Fill in all sections thoroughly
3. Link to relevant issues
4. Add appropriate labels

### 3. Required Sections

The PR template includes several key sections:

#### Description

- Clear explanation of changes
- Purpose and motivation
- Impact on existing functionality

#### Type of Change

- 🪲 Bug Fix
- 🤩 Improvement to the IP
- 📝 New Feature
- 📚 Documentation Update
- 🔄 Dependency Update
- ⚠️ Breaking Change

#### Code Quality Checklist

```markdown
### Code Quality

- [ ] Code follows project style guidelines
- [ ] Code has been self-reviewed
- [ ] Complex logic is documented
- [ ] No new linting errors
- [ ] Changes are responsive/mobile-friendly (if UI changes)

### Testing

- [ ] Added/updated unit tests
- [ ] All CI checks pass (tests, lint, build)
- [ ] Manual testing completed
- [ ] Performance impact considered

### Documentation

- [ ] Updated relevant documentation
- [ ] Added comments to complex code
- [ ] Updated changelog if required
- [ ] API changes are documented (if applicable)

### Security & Safety

- [ ] No sensitive information exposed
- [ ] Error handling implemented
- [ ] Security implications considered
- [ ] Breaking changes are documented
```

## Review Process

### Required Approvals

- Minimum of one approval from team leads
- All CI checks must pass
- No pending requested changes

### Review Criteria

Reviewers should check:

1. **Code Quality**

   - Follows coding standards
   - Well-structured and maintainable
   - No code smells
   - Appropriate error handling

2. **Testing**

   - Adequate test coverage
   - Tests are meaningful and robust
   - Edge cases considered
   - Performance implications tested

3. **Security**

   - No vulnerabilities introduced
   - Secure coding practices followed
   - Sensitive data handled appropriately

4. **Documentation**
   - Clear and complete
   - API changes documented
   - Comments on complex logic

## PR Size Guidelines

To ensure effective reviews:

- **Small**: < 200 lines changed
- **Medium**: 200-500 lines changed
- **Large**: 500-1000 lines changed
- **Extra Large**: > 1000 lines changed

For large changes:

- Break into smaller PRs if possible
- Provide detailed documentation
- Consider phased implementation

## CI/CD Integration

### Required Checks

1. **Expo App**

   - Lint & Type Check job
   - Test job with coverage requirements
   - Build job

2. **API**
   - Build & Test job
   - Security Scan job

### Coverage Requirements

- Frontend: 80% overall coverage
- Backend: Maintained or improved coverage

## Common Issues

### PR Checklist Incomplete

- Ensure all items are checked
- Provide explanation for unchecked items

### Failed CI Checks

1. Review the CI logs
2. Fix issues locally
3. Push updates
4. Ensure all checks pass

### Missing Documentation

- Add inline documentation
- Update relevant docs
- Include changelog entries

## Best Practices

1. **Regular Updates**

   - Keep PRs up to date with main
   - Resolve conflicts promptly
   - Respond to review comments quickly

2. **Clear Communication**

   - Detailed PR descriptions
   - Regular status updates
   - Prompt responses to questions

3. **Quality Focus**

   - Self-review before requesting reviews
   - Address all feedback
   - Maintain high code standards

4. **Efficient Reviews**
   - Keep PRs focused and small
   - Provide context and reasoning
   - Be responsive to feedback

## Post-Merge Actions

1. Delete the branch if no longer needed
2. Update related issues
3. Monitor deployment
4. Verify changes in staging

## Additional Resources

- [Contributing Guidelines](/CONTRIBUTING.md)
- [Code of Conduct](/CODE_OF_CONDUCT.md)
- [Development Setup](/docs/setup/auth.md)
