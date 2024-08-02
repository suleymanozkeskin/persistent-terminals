# Persistent Terminals

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

- persistentTerminals.terminals: Array of terminal configuration
- persistentTerminals.restrictedCommands: Array of additional user-defined restricted commands to prevent execution

## Security

This extension restricts potentially dangerous commands by default. You can customize the restricted commands in your workspace settings json file.

```json
    "persistentTerminals.userRestrictedCommands": [
    "dangerous-command",
    "another-risky-command"
    ]
```

## Known Issues

- The extension does not support the persistence of commands history across terminal sessions

## Release Notes

0.0.1
