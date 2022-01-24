var filter = require('through2-filter');
// this returns a filter stream that returns true if a WOF record has a field
// "geometry" with "type" NOT equalled to "Point"
module.exports.create = function create() {
  return filter.obj(function (wofData) {
    const result = wofData.geometry.hasOwnProperty('type') &&
      wofData.geometry.type !== 'Point';

    return result;
  });
};
