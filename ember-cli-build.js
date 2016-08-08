'use strict';

let merge = require('broccoli-merge-trees');
let stew = require('broccoli-stew');
let BroccoliCachingWriter = require('broccoli-caching-writer');
let ecmarkup = require('ecmarkup');
let fs = require('fs-extra');
let path = require('path');

function readFile(path) {
  return Promise.resolve(fs.readFileSync(path, 'utf8'));
}

// TODO: extract to broccoli-ecmarkup
class EcmarkupProcessor extends BroccoliCachingWriter {
  constructor(sourceNode, options) {
    super([sourceNode], options);
    this.options = options;
  }

  build() {
    let inputPath = this.inputPaths[0];
    let outputPath = this.outputPath;

    return ecmarkup.build(
      path.join(inputPath, this.options.inputFile),
      readFile,
      {}
    ).then((spec) => {
      if (spec === true) {
        throw new Error("Source files contained an error");
      }

      let specPath = path.join(outputPath, this.options.inputFile);
      fs.writeFileSync(specPath, spec.toHTML(), 'utf8');

      if (this.options.cssFile) {
        let ecmarkupPath = require.resolve('ecmarkup');
        fs.copySync(
          path.join(ecmarkupPath, '../../css/elements.css'),
          path.join(outputPath, this.options.cssFile)
        )
      }
    });
  }
}

// TODO: use broccoli-inject-livereload
function injectLiveReloadSnippet(sourceNode) {
  return stew.map(sourceNode, '*.html', function(contents) {
    let snippet = [
      "<!-- livereload snippet -->",
      "<script>document.write('<script src=\"http://'",
      " + (location.host || 'localhost').split(':')[0]",
      " + ':" + 35729 + "/livereload.js?snipver=1\"><\\/script>')",
      "</script>",
     ""
    ].join('\n');

    return contents.replace(/<\/body>/, function (w) {
      return snippet + w;
    });
  });
}

module.exports = function() {
  let ecmarkupOutput = new EcmarkupProcessor('src', {
    inputFile: 'index.html',
    cssFile: 'ecmarkup.css'
  });

  if (process.env.EMBER_ENV !== 'production') {
    ecmarkupOutput = injectLiveReloadSnippet(ecmarkupOutput);
  }

  return ecmarkupOutput;
};
