#!/usr/bin/env node
/**
 * Applies repo-owned agent guidance after npm install.
 * NGUI postinstall may copy generic .agents/ and .cursor/ — this restores the app-specific set.
 */
const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs');
const { dirname, join } = require('node:path');

const root = join(__dirname, '..');
const source = join(root, 'agent-guidance');

function copyTree(from, to) {
  if (!existsSync(from)) return;
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

copyTree(join(source, 'cursor'), join(root, '.cursor'));
copyTree(join(source, 'skills'), join(root, '.cursor', 'skills'));
copyTree(join(source, 'skills'), join(root, '.agents', 'skills'));
cpSync(join(source, 'agents', 'README.md'), join(root, '.agents', 'README.md'));
cpSync(join(source, 'AGENTS.md'), join(root, 'AGENTS.md'));

console.log('[sync-agent-guidance] applied app-specific AGENTS.md, .cursor/, and .agents/');
