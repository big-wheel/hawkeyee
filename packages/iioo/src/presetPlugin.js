/* eslint-disable no-unused-vars */
/**
 * @file: injectedListener
 * @author: Cuttle Cong
 * @date: 2018/1/17
 * @description:
 */
import bole from 'bole'
import garnish from 'garnish'
import { join } from 'path'
import opn from 'opn'
import FriendlyErrorsPlugin from 'friendly-errors-webpack-plugin'
import mylocalIP from 'my-local-ip'
import unique from 'array-unique'

import paths from './lib/paths'
// eslint-disable-next-line no-unused-vars
export default function presetPlugin(options) {
  const iioo = this
  const level = iioo.options.logLevel
  const logger = garnish({
    level,
    name: 'iioo'
  })
  logger.pipe(process.stdout)
  bole.output({
    level,
    stream: logger
  })

  const log = iioo.console
  iioo
    .on('this-options', options => {
      log.info(`Hash: ${options.hash}`)
    })
    .on('this-server', server => {
      const port = server.__server.address().port
      // TODO better output
      log.info('iioo run in:')
      log.info(`  http://${'localhost'}:${port}`)
      log.info(`  http://${mylocalIP()}:${port}`)

      if (iioo.options.open) {
        opn(`http://localhost:${port}`)
      }
    })
    .on('after-webpackServer', server => {

      // https://juejin.im/entry/57bacd81165abd0066262eae
      iioo.compiler.plugin('compilation', function (compilation) {
        compilation.plugin('html-webpack-plugin-after-emit', function (data, callback) {
          iioo.hotMiddleware.publish({ action: 'reload' })
          callback()
        })
      })
    })
    .on('this-io', io => {
      // io.on('connection', client => {
      //   client.emit('hello', 'im server')
      //   client.on('say', data => {
      //     log.info('data from client', data)
      //   })
      //   log.warn('connection')
      // })
    })

  iioo
    .on('getWebpackConfig.options', options => {
      if (options.entry && options.entry.app) {
        options.entry.app = [
          'webpack-hot-middleware/client'
        ].concat(options.entry.app)
      }
    })
    .on('this-webpackConfig', (config, webpack) => {
      const loader = config.module.rules.find(({ use }) => use.loader === 'babel-loader')
      loader.exclude = [
        function (name) {
          // exclude `node_module/iioo-plugin-*`
          return !/([/\\])(node_modules|bower_components)\1iioo-plugin/.test(name)
                 && /([/\\])(node_modules|bower_components)\1/.test(name)
        }
      ]

      config.resolve = config.resolve || {}
      config.resolve.alias = {
        iioo: paths.root,
        ...config.alias
      }

      config.resolveLoader = config.resolveLoader || {}
      // if iioo installed in the global
      //  webpack will find loader from current work directory to iioo global path
      //  DOC: https://webpack.js.org/configuration/resolve/#resolveloader
      config.resolveLoader.modules = unique([
        join(process.cwd(), 'node_modules'),
        join(paths.root, 'node_modules'),
        'node_modules'
      ])

      config.resolve.alias = {
        iioo: paths.root,
        ...config.alias
      }

      // deal with options.verbose
      if (iioo.options.silent) {
        config.plugins = config.plugins.filter(
          plugin => !(
            plugin instanceof FriendlyErrorsPlugin
          )
        )
      }
    })
    .on('this-webpackCompiler', compiler => {
      // Files created right before watching starts make watching go into a loop
      // https://github.com/webpack/watchpack/issues/25
      const timefix = 11000
      compiler.plugin('watch-run', (watching, callback) => {
        watching.startTime += timefix
        callback()
      })
      compiler.plugin('done', (stats) => {
        stats.startTime -= timefix
      })
    })
    .on('after-webpackBuilder', stats => {
      log.info('iioo build done!')
    })
}