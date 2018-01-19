/* global __resourceQuery */
import io from 'socket.io-client'
import querystring from 'querystring'

const options = {
  // port: 3666
}

// webpack global variable `__resourceQuery`  require('abc?__resourceQuery')
if (__resourceQuery) {
  const overrides = querystring.parse(__resourceQuery.slice(1))
  Object.assign(options, overrides)
  if (options.port) {
    module.exports = io(`http://localhost:${options.port}`)
  } else {
    console.error('[ERROR] The io don\'t has port.')
  }
} else {
  console.error('[ERROR] The io has been disabled, maybe you set the flag `disableIO` be true')
}
