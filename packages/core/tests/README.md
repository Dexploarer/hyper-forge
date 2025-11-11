# Asset Forge Admin Testing Suite

This directory contains comprehensive Playwright tests for admin functionality in Asset Forge.

## Test Files

### 1. Admin Dashboard Tests (`admin-dashboard.spec.ts`)

Tests all admin dashboard functionality including:

- Page loading and navigation
- Overview statistics display
- User profiles table
- Tab navigation
- Loading and error states
- Responsive design
- User badges and contact information
- Date formatting

### 2. Settings Page Tests (`settings-page.spec.ts`)

Tests settings page functionality including:

- Page loading
- Prompt category navigation
- JSON data display
- Extracted prompts section
- Copy to clipboard functionality
- Refresh functionality
- Mobile drawer navigation
- Responsive design
- Category descriptions

### 3. Security Tests (`security.spec.ts`)

Tests security and access control including:

- Authentication requirements
- Session management
- Role-based access control
- Logout functionality
- API endpoint protection
- HTTPS usage
- XSS prevention
- localStorage security
- CORS configuration

## Running Tests

### Prerequisites

Make sure both frontend and backend servers are running:

```bash
bun run dev
```

### Run All Tests

```bash
bun playwright test
```

### Run Specific Test Suite

```bash
# Admin dashboard tests only
bun playwright test admin-dashboard

# Settings page tests only
bun playwright test settings-page

# Security tests only
bun playwright test security
```

### Run Tests in UI Mode (Interactive)

```bash
bun playwright test --ui
```

### Run Tests in Headed Mode (See Browser)

```bash
bun playwright test --headed
```

### Generate HTML Report

```bash
bun playwright show-report test-results/html
```

## Test Results

Test results are saved in the following locations:

- **HTML Report**: `test-results/html/index.html`
- **JSON Report**: `test-results/results.json`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/` (on failure only)

## Screenshot Naming Convention

Screenshots are automatically taken during tests with descriptive names:

- `admin-dashboard-*.png` - Admin dashboard screenshots
- `settings-*.png` - Settings page screenshots
- `security-*.png` - Security test screenshots

## Authentication

The test suite uses a custom authentication helper (`helpers/auth.ts`) that:

- Handles login flow
- Manages navigation
- Checks authentication state
- Handles logout

**Note**: Current authentication is simplified. For full Privy authentication testing, you'll need to implement the actual Privy login flow in the helper.

## Test Coverage

### Admin Dashboard

- ✅ Page loading
- ✅ Statistics display
- ✅ User table with columns
- ✅ Tab navigation
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ User badges
- ✅ Contact information
- ✅ Date formatting

### Settings Page

- ✅ Page loading
- ✅ Category navigation
- ✅ JSON data display
- ✅ Copy functionality
- ✅ Refresh functionality
- ✅ Collapsible sections
- ✅ Mobile drawer
- ✅ Responsive design
- ✅ Prompt counts

### Security

- ✅ Authentication requirements
- ✅ Session management
- ✅ Logout functionality
- ✅ API protection
- ✅ XSS prevention
- ✅ HTTPS verification
- ✅ localStorage security
- ✅ CORS configuration

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
# Install Playwright browsers
bunx playwright install --with-deps

# Run tests with CI configuration
CI=true bun playwright test
```

## Debugging Tests

### Debug a Specific Test

```bash
bun playwright test --debug admin-dashboard
```

### Use Playwright Inspector

```bash
PWDEBUG=1 bun playwright test
```

### View Trace

```bash
bun playwright show-trace test-results/<trace-file>.zip
```

## Writing New Tests

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   import { createAuthHelper } from "./helpers/auth";
   ```
3. Write your test suite using `test.describe()`
4. Use the auth helper for authentication
5. Take screenshots for visual verification
6. Run tests locally before committing

## Best Practices

1. **Use descriptive test names**: Test names should clearly describe what is being tested
2. **Take screenshots**: Screenshots help with debugging and documentation
3. **Handle async properly**: Always await async operations
4. **Use proper selectors**: Prefer role-based selectors over class names
5. **Test error states**: Don't just test happy paths
6. **Test responsive design**: Test on multiple viewport sizes
7. **Clean up after tests**: Ensure tests don't affect each other

## Known Limitations

1. **Authentication**: Currently uses simplified auth check. Full Privy integration needed for complete auth testing.
2. **API Mocking**: Tests use real API. Consider adding MSW for API mocking in future.
3. **User Roles**: Tests assume admin access. Need to add role-based testing with different user types.
4. **Database State**: Tests don't reset database state. Consider adding test fixtures.

## Future Improvements

- [ ] Add full Privy authentication flow
- [ ] Add API mocking with MSW
- [ ] Add database fixtures and teardown
- [ ] Add performance testing
- [ ] Add accessibility testing (a11y)
- [ ] Add visual regression testing
- [ ] Add role-based testing (admin vs regular user)
- [ ] Add E2E workflow tests
- [ ] Add load testing

## Support

For issues or questions about the test suite:

1. Check test output and screenshots
2. Review the test code for clarity
3. Check Playwright documentation: https://playwright.dev
4. Check Asset Forge documentation in `dev-book/`
