const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const { NotionAgent } = require('notionapi-agent')
const { getOnePageAsTree } = require('nast-util-from-notionapi')
const { renderToHTML } = require('nast-util-to-html')
const Sqrl = require('squirrelly')

const { log } = require('./utils')

module.exports = {
  renderPost
}

/**
 * @typedef {Object} PostOperation
 * @property {boolean} doFetchPage
 * @property {boolean} enablePlugin
 */

/**
 * @typedef {Object} NotablogPlugin
 * @property {string} name
 * @property {Function} func
 * @property {Object} options
 */

/**
 * @typedef {Object} RenderPostTask
 * @property {SiteMetadata} siteMeta
 * @property {Object} post - ...PageMetadata + cacheUri
 * @property {PostOperation} operations
 * @property {NotablogPlugin[]} plugins
 */

/**
 * Render a post.
 * @param {RenderPostTask} task
 */
async function renderPost(task) {
  if (task != null) {
    const siteMeta = task.siteMeta
    const templateProvider = task.templateProvider
    const cacheProvider = task.cacheProvider
    const post = task.post
    const operations = task.operations
    const plugins = task.plugins

    const pageID = post.id

    let nast, contentHTML

    /** Fetch page. */
    if (operations.doFetchPage) {
      log.info(`Fetch page ${pageID}`)
      nast = await getOnePageAsTree(pageID, new NotionAgent({ suppressWarning: true, verbose: false }))
      cacheProvider.set(post.cacheUri, nast)
    } else {
      log.info(`Read page cache ${pageID}`)
      nast = await cacheProvider.get(post.cacheUri)
    }

    /** Run `beforeRender` plugins. */
    if (operations.enablePlugin) {
      log.info(`Run beforeRender plugins on ${pageID}`)
      plugins.forEach(plugin => {
        if (typeof plugin.func === 'function')
          plugin.func.call({
            pageType: 'post',
            context: {
              siteMeta, post
            },
            options: plugin.options
          })
        else
          log.warn(`Plugin ${plugin.name} is in wrong format, skipped`)
      })
    }

    /** Render with template. */
    if (post.publish) {
      log.info(`Render page ${pageID}`)
      contentHTML = renderToHTML(nast, { contentOnly: true })
      const workDir = process.cwd()
      const outDir = path.join(workDir, 'public')
      const postPath = path.join(outDir, post.url)

      Sqrl.autoEscaping(false)
      const html = Sqrl.Render(templateProvider.get(post.template), {
        siteMeta,
        post: {
          ...post,
          contentHTML
        }
      })
      await fsPromises.writeFile(postPath, html, { encoding: 'utf-8' })
    } else {
      log.info(`Skip rendering of unpublished page ${pageID}`)
    }
  }
}