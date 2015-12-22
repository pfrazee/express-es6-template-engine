const path = require('path'),
  fs = require('fs'); // this engine requires the fs module
module.exports = function (options) { // define the template engine
  /* jshint ignore:start */
  const interpolate = (content, keyList, valList) => new Function(
      ...keyList,
      'return `' + content + '`;'
    )(...valList),
    /* jshint ignore:end */
    readPartial = (filePath) => new Promise(
      (resolve, reject) => fs.readFile(
        path.join(this.viewsPath, filePath),
        'utf-8',
        (err, content) => err ? reject(new Error(err)) : resolve(content)
      )
    );
  this.viewsPath = path.join(__dirname, options && options.viewsPath || 'views');
  this.render = (filePath, dict, callback) => {
    const compile = (err, content) => {
      var locals = dict.locals || {},
        localsList = Object.keys(locals),
        partialsList = Object.keys(dict.partials || {}),
        valList = localsList.map(i => locals[i]),
        keyList = localsList.concat(partialsList);
      if(err) {
        return callback(new Error(err));
      }
      if(partialsList.length) {
        return Promise.all(partialsList.map(i => readPartial(dict.partials[i])))
          .then(values => {
            const valTempList = valList.concat(values);
            valList = valList.concat(
              values.map(i => interpolate(i, keyList, valTempList))
            );
            return callback(null, interpolate(content, keyList, valList));
          });
      }
      return callback(null, interpolate(content, keyList, valList));
    };
    if (dict.template) {
      return compile(null, filePath);
    }
    else {
      fs.readFile(filePath, 'utf-8', compile);
    }
  };
  return this.render;
};