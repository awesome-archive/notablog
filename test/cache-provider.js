const fs = require('fs')
const path = require('path')

const CacheProvider = require('../src/cache-provider')
const notionCacheDir = path.join(__dirname, 'notion')

/** Prepare */
fs.mkdirSync(notionCacheDir, { recursive: true })

/** Main */
const c = new CacheProvider(__dirname)

/** \ and / will be ignored */
const uri = 'notion://123/456\\789'

/** This will fail */
console.log(c.get(uri))

/** Write something */
c.set(uri, { test: '123123' })

/** This will succeed */
console.log(c.get(uri))

/** Cleanup */
fs.rmdirSync(notionCacheDir, { recursive: true })