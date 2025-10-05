# Persistent Terminals

[![Version](https://img.shields.io/visual-studio-marketplace/v/suleymanozkeskin.persistent-terminals)](https://marketplace.visualstudio.com/items?itemName=suleymanozkeskin.persistent-terminals)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/suleymanozkeskin.persistent-terminals)](https://marketplace.visualstudio.com/items?itemName=suleymanozkeskin.persistent-terminals)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/suleymanozkeskin.persistent-terminals)](https://marketplace.visualstudio.com/items?itemName=suleymanozkeskin.persistent-terminals)
[![License](https://img.shields.io/github/license/suleymanozkeskin/persistent-terminals)](https://github.com/suleymanozkeskin/persistent-terminals/blob/master/LICENSE.md)

Persistent Terminals is a VS Code extension that allows you to set up and automatically launch preconfigured terminals when you open your workspace.

## Features

- Automatically create multiple terminals with custom names and colors
- Execute predefined commands in each terminal upon creation
- Restrict potentially dangerous commands for improved security
- Customize restricted commands via user settings

## Installation

1. Install the extension from the VS Code Marketplace
2. Reload VS Code

## Usage

1. Open your workspace settings (JSON) file
2. Add a `persistentTerminals.terminals` configuration and the configured terminals will be created automatically when you open your workspace or reload VS Code.

```json
"persistentTerminals.terminals": [
  {
    "name": "Backend",
    "color": "terminal.ansiGreen",
    "commands": [
      "cd backend",
      "uvicorn app.main:app --reload"
    ]
  },
  {
    "name": "Frontend",
    "color": "terminal.ansiBlue",
    "commands": [
      "cd frontend",
      "npm start"
    ]
  }
]
```

## Extension Settings

This extension contributes the following settings:

- `persistentTerminals.terminals`: Array of terminal configurations
- `persistentTerminals.userRestrictedCommands`: Array of additional user-defined restricted commands to prevent execution
- `persistentTerminals.enableLogging`: Enable logging to `persistent-terminals.log` file (default: `false`)

## Security

This extension restricts potentially dangerous commands by default. You can customize the restricted commands in your workspace settings json file.

```json
    "persistentTerminals.userRestrictedCommands": [
    "dangerous-command",
    "another-risky-command"
    ]
```

## Logging

To enable logging, add this to your workspace settings:

```json
"persistentTerminals.enableLogging": true
```

This will create a `persistent-terminals.log` file in your workspace root (ignored by git by default).

## Known Issues

- The extension does not support the persistence of commands history across terminal sessions

## Release Notes

### 0.0.3

- **Breaking**: Logging is now opt-in (set `enableLogging: true` to enable)
- Fixed: Commands no longer re-execute on existing terminals when extension reloads
- Fixed: Log file now ignored by git by default
- Improved: Better error messages and UX feedback
- Improved: Stronger command validation and security
- Improved: Async file operations with proper error handling
