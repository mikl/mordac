// Generates the Atom feed and write it to disk.

'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');

var ATOMWriter = require('atom-writer');
var XMLWriter = require('xml-writer');
var cheerio = require('cheerio');
var moment = require('moment');
var output_dir = path.resolve(__dirname, 'public');

// Create the output dir when this file is loaded.
fs.mkdir(output_dir, function (err) {
  // If exists already, fail silently.
  if (err && err.code === 'EEXIST') {
    return;
  }
  else {
    throw err;
  }
});

// Generate HTML fragment for image.
function htmlImageFragment(url, title) {
  var xw = new XMLWriter();

  xw.startElement('div');
  xw.startElement('img');
  xw.writeAttribute('alt', title);
  xw.writeAttribute('src', url);
  xw.writeAttribute('title', title);

  return xw.toString();
}

module.exports = function generator(values) {
  var baseURN = 'urn:mordac:feed:';
  var xw = new XMLWriter(true);
  var aw = new ATOMWriter(xw);
  
  // Generate a full, standalone, XML document.
  xw.startDocument('1.0', 'utf-8');

  // Generate the feed header.
  aw
    .startFeed(baseURN + 'atom.xml')
    .writeTitle('Mordac’s RSS feed')
    .writeAuthor('Scott Adams')
    .writeContributor('Mordac the Preventer of Information Services');


  // Generate an entry for each value.
  Object.keys(values).forEach(function (key) {
    // Generate a fake timestamp for each post, so feed readers do not
    // consider them new/updated accidentally.
    var date = new Date(key + 'T13:37:00Z');

    aw
      .startEntry(baseURN + 'entry:' + key, date, date)
      .writeTitle(values[key].largeImage.title || '')
      .writeContent(htmlImageFragment(values[key].largeImage.url, values[key].largeImage.title || ''), 'html')
      .endEntry();
  });

  aw.endFeed();
  xw.endDocument();

  fs.writeFile(output_dir + '/atom.xml', xw.toString(), function (err) {
    if (err) { throw err; }
  });
};
