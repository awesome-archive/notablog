const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const { test } = require('zora')

const CacheProvider = require('../src/cache-provider')
const notionCacheDir = path.join(__dirname, 'notion')

test('', async t => {
  /** Prepare */
  await fsPromises.mkdir(notionCacheDir, { recursive: true })

  /** Main */
  const c = new CacheProvider(__dirname)

  /** \ and / will be ignored */
  const uri = 'notion://123/456\\789'

  /** This will fail */
  let cache = await c.get(uri)
  t.equal(typeof cache, 'undefined', 'should be undefined')

  /** Write something */
  const cacheData = { test: '123123' }
  await c.set(uri, cacheData)

  /** This will succeed */
  cache = await c.get(uri)
  t.deepEqual(cache, cacheData, 'should get an object')

  /** Cleanup */
  fsPromises.rmdir(notionCacheDir, { recursive: true })
})