// Parse the Dilbert.com markup, and locate the data we need.

'use strict';

var cheerio = require('cheerio');

module.exports = function (date, markup, callback) {
  var extractedValues = {};

  var $ = cheerio.load(markup);

  var img = $('#strip_enlarged_' + date + ' img');

  extractedValues.largeImage = {
    title: img.attr('title'),
    url: img.attr('src'),
  };

  callback(null, date, extractedValues);
};
