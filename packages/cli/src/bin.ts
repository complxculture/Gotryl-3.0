#!/usr/bin/env node
import { program } from './index.js';

try {
  await program.parseAsync(process.argv);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
