/**
 * @file: pluginHelper
 * @author: Cuttle Cong
 * @date: 2018/1/17
 * @description:
 */
import resolvePlugin from '../../utils/resolvePlugin'
import { isFunction } from 'util'

export default iioo => {
  return {
    // depend plugins, will run the plugins.
    //  options.force means ignore checking the depend plugin has already existed
    depend(plugins, options = {}) {
      const { force, ...rest } = options
      const opts = { prefix: 'iioo-plugin-', cwd: iioo.cwd, ...rest }
      plugins = plugins.map(plugin => resolvePlugin(plugin, opts))
      plugins.forEach(plugin => {
        if (isFunction(plugin[0])) {
          if (force || !this.pluginIsExisted(plugin, rest)) {
            plugin[0].call(iioo, plugin[1])
          }
        }
      })
    },

    // TODO  need to compare the `package.json` { name, version }
    pluginIsExisted(plugin, options) {
      const opts = { prefix: 'iioo-plugin-', cwd: iioo.cwd, ...options }
      const [reqPlugin] = resolvePlugin(plugin, opts)

      return iioo.plugins.find(plugin => reqPlugin === plugin)
    }
  }
}
