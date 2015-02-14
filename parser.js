// Parse the Dilbert.com markup, and locate the data we need.

'use strict';

var cheerio = require('cheerio');

module.exports = function (date, markup, callback) {
  var extractedValues = {};

  var $ = cheerio.load(markup);

  var img = $('.comic-item-container .img-comic');

  extractedValues.largeImage = {
    title: img.attr('alt'),
    url: img.attr('src')
  };

  if (!extractedValues.largeImage.title || !extractedValues.largeImage.url) {
    callback('Failed to extract image for date: ' + date);
  }

  callback(null, date, extractedValues);
};
