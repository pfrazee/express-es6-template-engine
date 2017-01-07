const fs = require('fs') // this engine requires the fs module
module.exports = (function (options) { // define the template engine
  /* jshint ignore:start */
  const interpolate = (content, keyList, valList) => (new Function(...keyList, 'return `' + content + '`;')(...valList))
  /* jshint ignore:end */
  function readPartial (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, content) => {
        if (err) reject(err)
        else resolve(content)
      })
    })
  }

  this.render = (filePath, locals, callback) => {
    const compile = (err, content) => {
      locals.partials = locals.partials || {}
      var localKeys = Object.keys(locals)
      var localValues = localKeys.map(k => locals[k])
      var partialKeys = Object.keys(locals.partialPaths || {})
      if (err) {
        return callback(new Error(err))
      }
      if (partialKeys.length) {
        // read all partials
        return Promise.all(partialKeys.map(k => readPartial(locals.partialPaths[k])))
          .then(partialValues => {
            // render the partials
            partialKeys.forEach((k, index) => {
              locals.partials[k] = interpolate(partialValues[index], localKeys, localValues)
            })
            // mark as rendered
            locals.partials = true
            // render the template
            return callback(null, interpolate(content, localKeys, localValues))
          })
          .catch(err => callback(err))
      }
      return callback(null, interpolate(content, localKeys, localValues))
    }
    fs.readFile(filePath, 'utf-8', compile)
  }
  return this.render
})()
