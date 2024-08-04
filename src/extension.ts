import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface TerminalConfig {
  name: string;
  color: string;
  commands: string[];
}

const BASE_RESTRICTED_COMMANDS = [
  "rm -rf",
  "sudo",
  "chmod",
  "chown",
  "mv /",
  "cp -r /",
  "docker run --privileged",
  "docker run -v /:/host",
];

const RESTRICTED_COMMAND_PATTERNS = [
  /^ssh /,
  /^telnet /,
  /^ftp /,
  /^git .*(--force|-f)/,
  /eval\s*\(/,
];

function getRestrictedCommands(): string[] {
  const userRestrictedCommands = vscode.workspace
    .getConfiguration("persistentTerminals")
    .get("userRestrictedCommands", []) as string[];
  return [...BASE_RESTRICTED_COMMANDS, ...userRestrictedCommands];
}

function isCommandRestricted(command: string): boolean {
  const restrictedCommands = getRestrictedCommands();
  return (
    restrictedCommands.some((restricted) => command.startsWith(restricted)) ||
    RESTRICTED_COMMAND_PATTERNS.some((pattern) => pattern.test(command))
  );
}

function validateConfig(config: TerminalConfig[]): string[] {
  const errors: string[] = [];

  config.forEach((terminal, index) => {
    if (!terminal.name) {
      errors.push(`Terminal ${index + 1}: Name is required`);
    }
    if (!terminal.color) {
      errors.push(`Terminal ${index + 1}: Color is required`);
    }
    if (!Array.isArray(terminal.commands) || terminal.commands.length === 0) {
      errors.push(`Terminal ${index + 1}: Commands must be a non-empty array`);
    } else {
      terminal.commands.forEach((command, cmdIndex) => {
        if (isCommandRestricted(command)) {
          errors.push(
            `Terminal ${index + 1}, Command ${
              cmdIndex + 1
            }: "${command}" is restricted`
          );
        }
      });
    }
  });

  return errors;
}

function logAction(message: string) {
  const logFile = path.join(
    vscode.workspace.workspaceFolders?.[0].uri.fsPath || "",
    "persistent-terminals.log"
  );
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Persistent Terminals extension is now active!");
  logAction("Extension activated");

  let disposable = vscode.commands.registerCommand(
    "persistent-terminals.createTerminals",
    createPersistentTerminals
  );
  context.subscriptions.push(disposable);

  if (vscode.workspace.workspaceFolders) {
    createPersistentTerminals();
  }
}

function queryExistingTerminalWithName(
  name: string
): vscode.Terminal | undefined {
  return vscode.window.terminals.find((terminal) => terminal.name === name);
}

function createPersistentTerminals() {
  const config = vscode.workspace.getConfiguration("persistentTerminals");
  const terminals: TerminalConfig[] = config.get("terminals") || [];

  const configErrors = validateConfig(terminals);
  if (configErrors.length > 0) {
    vscode.window.showErrorMessage(
      "Invalid terminal configuration",
      ...configErrors
    );
    logAction(`Configuration errors: ${configErrors.join(", ")}`);
    return;
  }

  terminals.forEach((terminalConfig) => {
    let terminal = queryExistingTerminalWithName(terminalConfig.name);
    if (!terminal) {
      terminal = vscode.window.createTerminal({
        name: terminalConfig.name,
        color: new vscode.ThemeColor(terminalConfig.color),
      });
      logAction(`Created terminal: ${terminalConfig.name}`);
    } else {
      logAction(
        `Found existing terminal with given terminal name: ${terminalConfig.name}, Skipping creation..`
      );
    }

    terminalConfig.commands.forEach((command) => {
      if (isCommandRestricted(command)) {
        vscode.window.showWarningMessage(
          `Skipping restricted command in ${terminalConfig.name}: ${command}`
        );
        logAction(`Skipped restricted command: ${command}`);
      } else {
        terminal.sendText(command);
        logAction(`Executed command in ${terminalConfig.name}: ${command}`);
      }
    });
  });

  vscode.window.showInformationMessage(
    "Persistent terminals created successfully!"
  );
  logAction("Persistent terminals creation completed");
}

export function deactivate() {
  logAction("Extension deactivated");
}
