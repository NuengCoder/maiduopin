#!/usr/bin/env node
/**
 * Reports the state of the backend integration.
 *
 * The buyer MVP runs entirely on `miniprogram/services/mockApi.ts`. The
 * `server/` folder described in maiduopin_impl_plan.md does not exist yet, so
 * this target explains what is wired today, what the REST layer has to
 * implement, and what has to change to switch over.
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const serverDir = path.join(root, 'server')
const facadePath = path.join(root, 'miniprogram', 'services', 'api.ts')
const mockPath = path.join(root, 'miniprogram', 'services', 'mockApi.ts')

const line = (char = '-') => console.log(char.repeat(64))

const facade = fs.existsSync(facadePath) ? fs.readFileSync(facadePath, 'utf8') : ''
const mock = fs.existsSync(mockPath) ? fs.readFileSync(mockPath, 'utf8') : ''
const endpoints = [...mock.matchAll(/^export const (\w+)\s*=/gm)]
  .map((m) => m[1])
  .filter((name) => !/^[A-Z0-9_]+$/.test(name))
const mockBacked = /from\s+'\.\/mockApi'/.test(facade)

line('=')
console.log('maiduopin backend status')
line('=')

console.log(`server/            ${fs.existsSync(serverDir) ? 'present' : 'not created yet'}`)
console.log(`api facade         ${mockBacked ? 'mock adapter (miniprogram/services/mockApi.ts)' : 'custom adapter'}`)
console.log(`mock endpoints     ${endpoints.length}`)
console.log(`persistence        wx local storage (10 MB quota, per device)`)

line()
console.log('API contract the REST client has to implement:')
for (const name of endpoints) {
  console.log(`  - ${name}`)
}

line()
if (fs.existsSync(serverDir)) {
  console.log('Next: point miniprogram/services/api.ts at the REST client and run')
  console.log('      the server from server/ (see its README).')
} else {
  console.log('Next steps (see maiduopin_impl_plan.md):')
  console.log('  1. server/   NestJS + Prisma + PostgreSQL + Redis')
  console.log('               auth, products, cart, orders, mock pay, growth campaigns')
  console.log('  2. admin/    Vite + React + Ant Design operations console')
  console.log('  3. rewrite miniprogram/services/api.ts to call the REST endpoints')
  console.log('     above; pages never import mockApi directly, so nothing else moves.')
  console.log('  4. swap mock pay for WeChat Pay and disable it in production.')
}

line('=')
