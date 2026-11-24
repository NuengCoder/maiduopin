#!/usr/bin/env node
/**
 * Tiny static server for index.html (the project landing page).
 * No dependencies - `npm install` only pulls typescript for this repo.
 *
 *   node scripts/serve.js            # http://localhost:5173
 *   PORT=8080 node scripts/serve.js
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const port = Number(process.env.PORT) || 5173

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
}

const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url || '/').split('?')[0])
  const relative = url === '/' ? 'index.html' : url.replace(/^\/+/, '')
  const target = path.join(root, relative)

  // never serve outside the project directory
  if (!target.startsWith(root)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  fs.readFile(target, (error, data) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      response.end(`404 ${relative}`)
      return
    }
    response.writeHead(200, {
      'content-type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    })
    response.end(data)
  })
})

server.listen(port, () => {
  console.log(`maiduopin landing page -> http://localhost:${port}`)
  console.log('Ctrl+C to stop.')
})
