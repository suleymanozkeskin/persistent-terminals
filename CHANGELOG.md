# Change Log

All notable changes to the "persistent-terminals" extension will be documented in this file.

## [Version 0.0.3]

### Breaking Changes

- Logging is now opt-in (set `persistentTerminals.enableLogging: true` to enable)

### Fixed

- Commands no longer re-execute on existing terminals when extension reloads
- Log file now ignored by git by default (added to .gitignore)
- Error messages now display properly with all validation errors
- Added workspace validation to prevent crashes when no workspace is open

### Improved

- Stronger command validation (trims whitespace, additional dangerous commands blocked)
- Async file operations with proper error handling
- Better UX feedback (only shows success when terminals are actually created)
- Added type guards for safer terminal operations

## [Version 0.0.2]

- This release checks the existing terminals based on their names and creates new terminals if they do not exist.
- This feature helps to avoid creating duplicate terminals with the same name.

## [Version 0.0.1]

- Initial release
