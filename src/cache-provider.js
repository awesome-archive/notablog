const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises

const { log } = require('./utils')

const CACHE_NAMESPACE = {
  notion: 'notion'
}

class CacheProvider {

  /**
   * @param {string} cacheDir - The dir that stores cache.
   */
  constructor(cacheDir) {
    this.cacheDir = cacheDir
    this.getCachePath = getCachePath.bind(this)
  }



  /**
   * Get cache object by its uri.
   * @param {string} cacheUri - The uri of a cache object.
   * @returns {Promise<*>} The cache object.
   */
  async get(cacheUri) {
    log.debug(`Get cache "${cacheUri}"`)

    const cachePath = this.getCachePath(cacheUri)

    let fileContent, cacheObj

    try {
      fileContent = await fsPromises
        .readFile(cachePath, { encoding: 'utf-8' })
    } catch (error) {
      log.error(`Fail to read cache from ${cachePath}`)
      return undefined
    }

    try {
      cacheObj = JSON.parse(fileContent)
    } catch (error) {
      log.error(`Fail to parse JSON from ${cachePath}`)
      return undefined
    }

    return cacheObj
  }



  /**
   * Set cache object by its uri.
   * @param {string} cacheUri - The uri of a cache object.
   * @param {*} cacheData 
   */
  async set(cacheUri, cacheData) {
    log.debug(`Set cache "${cacheUri}"`)

    const cachePath = this.getCachePath(cacheUri)

    const notionCacheDir = path.join(this.cacheDir, CACHE_NAMESPACE.notion)
    if (!fs.existsSync(notionCacheDir)) {
      fs.mkdirSync(notionCacheDir, { recursive: true })
    }

    try {
      const serializedCacheData = JSON.stringify(cacheData)
      await fsPromises
        .writeFile(cachePath, serializedCacheData, { encoding: 'utf-8' })
    } catch (error) {
      log.error(`Fail to write cache to ${cachePath}`)
    }
  }



  /**
   * Ask a question about a cache object by its uri.
   * @param {string} cacheUri - The uri of a cache object.
   */
  wasCache(cacheUri) {
    const cachePath = this.getCachePath(cacheUri)

    return {
      /**
       * Whether the cache object file was modified (updated) after a
       * given timestamp.
       * @param {number} timeMs
       * @returns {boolean} 
       */
      updatedAfter: function (lastEditedTime) {

        try {
          const lastCacheTime = fs.statSync(cachePath).mtimeMs
          const ans = lastCacheTime > lastEditedTime
          return ans
        } catch (error) {
          log.error(error)
          return false
        }

      }
    }
  }
}

/**
 * @typedef CacheUri
 * @property {string} protocol
 * @property {string} key
 */

/**
 * Evaluate cache uri.
 * @param {string} cacheUri 
 * @returns {CacheUri}
 */
function evalCacheUri(cacheUri) {
  const re = /(.+):\/\/(.+)/
  const fo = cacheUri.match(re)
  const protocol = fo[1] || ''
  const key = fo[2] || ''
  return {
    protocol, key
  }
}

/**
 * Get cache file path.
 * @param {string} cacheUri 
 * @returns {string}
 */
function getCachePath(cacheUri) {
  const uri = evalCacheUri(cacheUri)
  const protocol = uri.protocol
  const key = uri.key

  let filename

  if (protocol && key) {
    switch (protocol) {
      case 'notion': {
        filename = path.join(
          this.cacheDir,
          CACHE_NAMESPACE.notion,
          key.replace(/\/|\\/g, '')
        )
        break
      }
      default:
        filename = ''
    }
  } else {
    filename = ''
  }

  return filename
}

module.exports = CacheProvider