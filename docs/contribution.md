# Contribution Guidelines

## Overview
Thank you for considering contributing to the Historical World Map project! This document provides guidelines for contributing to the project, whether you're adding historical data, improving code, or fixing bugs.

## How to Contribute

### Adding Historical Data

#### Government Data
1. Review the data format in `data-format.md`
2. Add new government entries to `governments.csv`
3. Ensure all required fields are filled
4. Provide accurate geographical coordinates
5. Include brief but informative descriptions
6. Verify year ranges for historical accuracy

#### Interaction Data
1. Review the data format in `data-format.md`
2. Add new interaction entries to `interactions.csv`
3. Verify that referenced government IDs exist
4. Ensure interaction years fall within government existence periods
5. Provide accurate descriptions of historical events

### Code Contributions

#### Setup Development Environment
1. Fork the repository
2. Clone your fork locally
3. Install dependencies
4. Set up a local development server

#### Code Style Guidelines
- Use ES6+ features where appropriate
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular
- Use consistent naming conventions:
  - Classes: PascalCase
  - Functions/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE

#### Documentation
- Update relevant documentation for any changes
- Include JSDoc comments for new functions
- Update API documentation for interface changes
- Document any new configuration options

#### Testing
- Add appropriate test cases for new features
- Ensure existing tests pass
- Test across different browsers
- Verify mobile responsiveness

### Submission Process

1. Create a new branch for your changes
2. Make your changes following the guidelines above
3. Commit your changes with clear, descriptive messages
4. Push to your fork
5. Submit a Pull Request (PR)

#### Pull Request Guidelines
- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- List any breaking changes
- Verify all tests pass
- Ensure documentation is updated

### Best Practices

#### Performance
- Minimize DOM manipulations
- Use efficient data structures
- Implement appropriate caching
- Optimize large data operations
- Consider mobile performance

#### Security
- Validate all input data
- Sanitize historical data
- Protect against XSS
- Use secure dependencies
- Follow CORS policies

#### Accessibility
- Maintain WCAG 2.1 compliance
- Provide keyboard navigation
- Include appropriate ARIA labels
- Ensure color contrast
- Support screen readers

## Community Guidelines

### Communication
- Be respectful and professional
- Use clear, concise language
- Help others learn and grow
- Accept constructive criticism
- Follow the code of conduct

### Issue Reporting
- Check for existing issues first
- Provide clear reproduction steps
- Include relevant system information
- Add screenshots or recordings if applicable
- Use issue templates when available

## Project Structure
Refer to the project's README for detailed information about:
- File organization
- Component architecture
- Build process
- Development workflow
- Deployment procedures

## Questions?
If you have questions about contributing:
1. Check existing documentation
2. Search closed issues
3. Ask in the project's discussion forum
4. Contact the maintainers

Thank you for helping improve the Historical World Map project!