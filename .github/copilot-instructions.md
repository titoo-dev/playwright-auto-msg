# 📬 Facebook Message Automation Bot

This is a Playwright automation script to log into Facebook using a saved Chrome user profile and send a predefined message to a specific user profile.

---

## 🚀 Features

- Logs in using a persistent Chrome profile
- Auto-fills credentials if needed (from `.env` or fallback)
- Navigates to a specific Facebook profile
- Sends a predefined message
- Uses robust selectors with fallback for high success rate
- Detailed logging for debugging and monitoring

---

## 🛡️ Development Guidelines - No Breaking Changes

### When Adding Features:

- Always maintain existing function signatures and return types
- Add new optional parameters at the end of parameter lists
- Use default values for new parameters to ensure backwards compatibility
- Create new functions/methods instead of modifying existing ones when possible
- Maintain existing configuration file structure - only add new optional fields

### When Refactoring:

- Preserve all existing public APIs and interfaces
- Keep existing selector strategies as fallbacks when adding new ones
- Maintain the same error handling behavior and error message formats
- Ensure existing environment variables and configuration options continue to work
- Test that existing automation flows work exactly as before

### When Fixing Bugs:

- Fix the issue without changing the expected behavior for valid use cases
- Maintain existing logging output format and levels
- Keep the same timing and wait strategies unless absolutely necessary
- Preserve existing file paths and directory structures
- Ensure fixes don't require users to update their configuration

### Validation Requirements:

- Always test with existing configuration files before suggesting changes
- Verify that all existing selectors and automation steps still work
- Check that error scenarios continue to be handled the same way
- Ensure no new dependencies are required unless absolutely critical

### If Breaking Changes Are Unavoidable:

- Clearly document what will break and why the change is necessary
- Provide migration steps and backwards compatibility shims when possible
- Version the changes appropriately
- Give clear warnings about deprecated functionality before removing it

