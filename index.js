'use strict';

// Libraries from NPM.
var moment = require('moment');

// Our own modules.
var Fetcher = require('./fetcher'),
    generator = require('./generator'),
    parser = require('./parser');

// Basic use case, running `node .`
// Start the fetcher from the current moment.
if (require.main === module) {

  var iterator = new Fetcher(moment());

  // Fetch up to the last 30 days of comics and run the feed generator.
  iterator.run(30, function (err, values) {
    generator(values);
  });  
}
