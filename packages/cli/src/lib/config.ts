import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type ConfigFile = { apiKey: string; baseUrl: string };

export const CONFIG_DIR = path.join(os.homedir(), '.gotryl');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config');

export function readConfig(): ConfigFile | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as ConfigFile;
  } catch {
    return null;
  }
}

export function writeConfig(config: ConfigFile): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export function deleteConfig(): void {
  fs.rmSync(CONFIG_PATH, { force: true });
}
