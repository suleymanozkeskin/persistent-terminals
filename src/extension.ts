import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface TerminalConfig {
  name: string;
  color: string;
  commands: string[];
}

// Track which terminals have had their commands executed
const executedTerminals = new Set<string>();

const BASE_RESTRICTED_COMMANDS = [
  "rm -rf",
  "sudo",
  "chmod",
  "chown",
  "mv /",
  "cp -r /",
  "dd",
  "mkfs",
  "kill -9",
  "pkill",
  "killall",
  "reboot",
  "shutdown",
  "docker run --privileged",
  "docker run -v /:/host",
];

const RESTRICTED_COMMAND_PATTERNS = [
  /^ssh\s+/,
  /^telnet\s+/,
  /^ftp\s+/,
  /^git\s+.*(--force|-f)/,
  /eval\s*\(/,
  /sudo\s+-/,
];

function getRestrictedCommands(): string[] {
  const userRestrictedCommands = vscode.workspace
    .getConfiguration("persistentTerminals")
    .get("userRestrictedCommands", []) as string[];
  return [...BASE_RESTRICTED_COMMANDS, ...userRestrictedCommands];
}

function isCommandRestricted(command: string): boolean {
  const trimmedCommand = command.trim();
  const restrictedCommands = getRestrictedCommands();
  return (
    restrictedCommands.some((restricted) => trimmedCommand.startsWith(restricted)) ||
    RESTRICTED_COMMAND_PATTERNS.some((pattern) => pattern.test(trimmedCommand))
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

async function logAction(message: string): Promise<void> {
  const config = vscode.workspace.getConfiguration("persistentTerminals");
  const loggingEnabled = config.get("enableLogging", false);

  if (!loggingEnabled) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return; // Skip logging if no workspace folder
  }

  const logFile = path.join(workspaceFolder.uri.fsPath, "persistent-terminals.log");
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;

  try {
    await fs.promises.appendFile(logFile, logMessage);
  } catch (error) {
    // Silently fail to avoid disrupting extension functionality
    console.error("Failed to write to log file:", error);
  }
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

async function createPersistentTerminals() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showWarningMessage(
      "Persistent Terminals requires an open workspace folder"
    );
    return;
  }

  const config = vscode.workspace.getConfiguration("persistentTerminals");
  const terminals: TerminalConfig[] = config.get("terminals") || [];

  if (terminals.length === 0) {
    return; // No terminals to create
  }

  const configErrors = validateConfig(terminals);
  if (configErrors.length > 0) {
    const errorMessage = `Invalid terminal configuration:\n${configErrors.join("\n")}`;
    vscode.window.showErrorMessage(errorMessage);
    await logAction(`Configuration errors: ${configErrors.join(", ")}`);
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const terminalConfig of terminals) {
    let terminal = queryExistingTerminalWithName(terminalConfig.name);
    const alreadyExecuted = executedTerminals.has(terminalConfig.name);

    if (!terminal) {
      terminal = vscode.window.createTerminal({
        name: terminalConfig.name,
        color: new vscode.ThemeColor(terminalConfig.color),
      });
      createdCount++;
      await logAction(`Created terminal: ${terminalConfig.name}`);
    } else {
      skippedCount++;
      await logAction(
        `Found existing terminal: ${terminalConfig.name}, skipping creation`
      );
    }

    // Only execute commands if terminal is new or hasn't been executed yet
    if (!alreadyExecuted && terminal) {
      for (const command of terminalConfig.commands) {
        if (isCommandRestricted(command)) {
          vscode.window.showWarningMessage(
            `Skipping restricted command in ${terminalConfig.name}: ${command}`
          );
          await logAction(`Skipped restricted command: ${command}`);
        } else {
          terminal.sendText(command);
          await logAction(`Executed command in ${terminalConfig.name}: ${command}`);
        }
      }
      executedTerminals.add(terminalConfig.name);
    } else if (alreadyExecuted) {
      await logAction(
        `Skipping command execution for ${terminalConfig.name} (already executed)`
      );
    }
  }

  if (createdCount > 0) {
    vscode.window.showInformationMessage(
      `Created ${createdCount} terminal(s) successfully!`
    );
  }
  await logAction(`Terminals created: ${createdCount}, skipped: ${skippedCount}`);
}

export function deactivate() {
  logAction("Extension deactivated");
}
