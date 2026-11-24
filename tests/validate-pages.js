const fs = require('fs')
const path = require('path')

const root = 'miniprogram'
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
const issues = []

const routes = [
  ...app.pages,
  ...(app.subpackages || []).flatMap((pkg) => pkg.pages.map((page) => `${pkg.root}/${page}`)),
]

for (const route of routes) {
  for (const ext of ['ts', 'wxml', 'json', 'less']) {
    const file = path.join(root, `${route}.${ext}`)
    if (!fs.existsSync(file)) {
      issues.push(`missing page file: ${route}.${ext}`)
    }
  }
}

for (const [name, target] of Object.entries(app.usingComponents || {})) {
  if (!fs.existsSync(path.join(root, `${target}.ts`))) {
    issues.push(`missing component "${name}": ${target}`)
  }
}

if (app.tabBar && app.tabBar.custom) {
  for (const ext of ['ts', 'wxml', 'json', 'less']) {
    const file = path.join(root, 'custom-tab-bar', `index.${ext}`)
    if (!fs.existsSync(file)) {
      issues.push(`missing custom tab bar file: custom-tab-bar/index.${ext}`)
    }
  }
}

const routeSet = new Set(routes)
let fileCount = 0
const walk = (dir, onFile) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, onFile)
    } else {
      fileCount += 1
      onFile(full)
    }
  }
}

walk(root, (file) => {
  if (file.endsWith('.ts')) {
    const source = fs.readFileSync(file, 'utf8')
    const navRegex = /['"`]\/((?:pages|package[A-Za-z]+)\/[^'"`?]+)/g
    let match
    while ((match = navRegex.exec(source))) {
      if (!routeSet.has(match[1])) {
        issues.push(`invalid navigation target in ${file}: /${match[1]}`)
      }
    }
    return
  }

  if (!file.endsWith('.wxml')) {
    return
  }

  const tsFile = file.replace(/\.wxml$/, '.ts')
  if (!fs.existsSync(tsFile)) {
    return
  }
  const markup = fs.readFileSync(file, 'utf8')
  const source = fs.readFileSync(tsFile, 'utf8')
  const handlerRegex = /\b(?:bind|catch|capture-bind|capture-catch)(?::?[a-zA-Z]+)="([A-Za-z_$][\w$]*)"/g
  const handlers = new Set()
  let match
  while ((match = handlerRegex.exec(markup))) {
    handlers.add(match[1])
  }
  for (const handler of handlers) {
    if (!new RegExp(`(^|[\\s,{])${handler}\\s*\\(`, 'm').test(source)) {
      issues.push(`missing handler "${handler}" for ${file}`)
    }
  }
})

if (issues.length) {
  console.error('Page validation failed:')
  for (const issue of issues) {
    console.error(`  - ${issue}`)
  }
  process.exit(1)
}

console.log(`Page validation passed: ${routes.length} routes, ${fileCount} files scanned.`)
