// Fetcher, gets the HTML page and returns the wanted data.

'use strict';

var async = require('async');
var moment = require('moment');
var levelup = require('level');
var path = require('path');
var request = require('request');
var winston = require('winston');

var parser = require('./parser');

module.exports = function (startFrom) {
  // Database to keep track of already fetched content.
  // The keys are the date, and the value is the data structure returned
  // by the parser. LevelUP transparently translates it to and from JSON.
  var db = levelup(path.resolve(__dirname, './mordac.db'), {
    valueEncoding: 'json',
  });

  // Save the point we started from.
  var startpoint = startFrom;

  // Keep track of where we are now.
  var position = startpoint;

  // Get data for a specific date.
  var fetchDate = function (date, callback) {
    // First, try getting it from the database.
    db.get(date, function (err, value) {
      // If we do not have data for this date yet, fetch the markup,
      // parse it and store the output.
      if ((err && err.name === 'NotFoundError') || !value ||
          !value.largeImage || !value.largeImage.url) {
        async.waterfall([
          function (cb) {
            fetchMarkup(date, cb);
          },

          // The parser takes the date and markup returned by fetchMarkup.
          parser,

          // Save the extracted data before proceeding.
          function (date, values, cb) {
            if (values) {
              db.put(date, values, function (err) {
                cb(err, date, values);
              });
            }
            else {
              cb();
            }
          }
        ], callback);
      }
      else {
        callback(err, date, value);
      }
    });
  };

  // Fetch markup for a specific date.
  var fetchMarkup = function (date, callback) {
    var URL = 'http://dilbert.com/' + date;

    winston.info('Fetching ' + URL);

    request(URL, function (error, response, body) {
      return callback(error, date, body);
    });
  };

  this.run = function (dayCount, callback) {
    var stopDate = moment(startpoint).subtract(dayCount, 'days');

    var dateValues = {};

    // Iterate sequentially over each of the days, unless an error occurs.
    async.whilst(
      function () { return position.isAfter(stopDate); },
      function (cb) {
        fetchDate(position.format('YYYY-MM-DD'), function (err, date, values) {
          if (values) {
            dateValues[date] = values;
          }

          cb(err, date, values);
        });

        // Subtract a day so we move on to the previous one.
        position.subtract(1, 'days');
      },
      function (err) {
        if (err) {
          winston.error(err);
        }

        callback(err, dateValues);
      }
    );
  };

  return this;
};
