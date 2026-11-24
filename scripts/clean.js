#!/usr/bin/env node
/**
 * Removes build leftovers only: the TypeScript smoke-test output and any
 * tsbuildinfo files. It never touches sources, node_modules or wx storage.
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const targets = [path.join(root, 'node_modules', '.cache', 'maiduopin-smoke')]

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (entry.name.endsWith('.tsbuildinfo')) {
      targets.push(full)
    }
  }
}

walk(root)

let removed = 0
for (const target of targets) {
  if (!fs.existsSync(target)) {
    continue
  }
  fs.rmSync(target, { recursive: true, force: true })
  console.log(`removed ${path.relative(root, target)}`)
  removed += 1
}

console.log(removed ? `clean: ${removed} path(s) removed.` : 'clean: nothing to remove.')
