const path = require('path')
const fs = require('fs')

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
  }

  /**
   * Get cache object by its uri.
   * @param {string} cacheUri - The uri of a cache object.
   * @returns {*} The cache object.
   */
  get(cacheUri) {
    log.debug(`Get cache "${cacheUri}"`)

    const filename = getCachePath(cacheUri, this.cacheDir)
    let fileContent, cacheObj

    try {
      fileContent = fs.readFileSync(filename, { encoding: 'utf-8' })
    } catch (error) {
      log.error(`Fail to read cache ${filename}`)
      return undefined
    }

    try {
      cacheObj = JSON.parse(fileContent)
    } catch (error) {
      log.error(`Fail to parse JSON ${filename}`)
      return undefined
    }

    return cacheObj
  }

  /**
   * Set 
   * @param {string} cacheUri 
   * @param {*} cacheData 
   */
  set(cacheUri, cacheData) {
    log.debug(`Set cache "${cacheUri}"`)

    const filename = getCachePath(cacheUri, this.cacheDir)

    const notionCacheDir = path.join(this.cacheDir, CACHE_NAMESPACE.notion)
    if (!fs.existsSync(notionCacheDir)) {
      fs.mkdirSync(notionCacheDir, { recursive: true })
    }

    try {
      fs.writeFileSync(filename, JSON.stringify(cacheData), { encoding: 'utf-8' })
    } catch (error) {
      log.error(`Fail to write cache ${filename}`)
    }
  }

  wasCache(cacheUri) {
    const file = getCachePath(cacheUri, this.cacheDir)

    return {
      updatedAfter: function (timeMs) {

        try {
          const lastCacheTime = fs.statSync(file).mtimeMs
          const updated = timeMs > lastCacheTime
          return updated
        } catch (error) {
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
 * @param {string} cacheDir
 * @returns {string}
 */
function getCachePath(cacheUri, cacheDir) {
  const uri = evalCacheUri(cacheUri)
  const protocol = uri.protocol
  const key = uri.key

  let filename

  if (protocol && key) {
    switch (protocol) {
      case 'notion': {
        filename = path.join(
          cacheDir,
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