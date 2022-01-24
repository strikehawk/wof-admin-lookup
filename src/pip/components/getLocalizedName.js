'use strict';

const _ = require('lodash');
const logger = require('pelias-logger').get('wof-pip-service');

/**
 * Return the localized name or default name for the given record
 *
 * @param {object} wofData
 * @param {string} langKey The ISO 3166-1 alpha-3 code of the target language. If no label exist for this language, a fallback value 
 * will be used
 * @returns {false|string}
 */
function getName(wofData, langKey) {

  // if this is a US county, use the qs:a2_alt for county
  // eg - wof:name = 'Lancaster' and qs:a2_alt = 'Lancaster County', use latter
  if (isUsCounty(wofData)) {
    return getPropertyValue(wofData, 'qs:a2_alt');
  }

  if (!langKey) {
    // build the preferred lang key to use for name, like 'name:deu_x_preferred'
    langKey = getOfficialLangName(wofData, [
      'wof:lang_x_preferred',
      'wof:lang_x_spoken',
      'wof:lang_x_official',
      'wof:lang'
    ]);
  }

  // attempt to use the following in order of priority and fallback to wof:name if all else fails
  const result =
    getLocalizedName(wofData, `label:${langKey}_x_preferred`) ||
    getLocalizedName(wofData, `name:${langKey}_x_preferred`) ||
    getPropertyValue(wofData, 'wof:label') ||
    getPropertyValue(wofData, 'wof:name');

  return result;
}

// this function is used to verify that a US county QS altname is available
function isUsCounty(wofData) {
  return 'US' === wofData.properties['iso:country'] &&
    'county' === wofData.properties['wof:placetype'] &&
    !_.isUndefined(wofData.properties['qs:a2_alt']);
}

/**
 * Returns the property name of the name to be used
 * according to the language specification
 *
 * example:
 *  if wofData[langProperty] === ['rus']
 *  then return 'name:rus_x_preferred'
 *
 * example with multiple values:
 *  if wofData[langProperty] === ['rus','ukr','eng']
 *  then return 'name:rus_x_preferred'
 *
 * @param {object} wofData
 * @param {string} langProperty
 * @returns {string}
 */
function getOfficialLangName(wofData, langProperty) {
  var languages = wofData.properties[langProperty];

  // convert to array in case it is just a string
  if (!(languages instanceof Array)) {
    languages = [languages];
  }

  if (languages.length > 1) {
    logger.silly(`more than one ${langProperty} specified`,
      wofData.properties['wof:lang_x_official'], languages);
  }

  return languages[0];
}

/**
 * Given a language property name return the corresponding name:* property if one exists
 * and false if that can't be found for any reason
 *
 * @param {object} wofData
 * @param {string} langProperty
 * @returns {false|string}
 */
function getLocalizedName(wofData, langProperty) {

  // check that there is a value at the specified property and that it's not
  // set to unknown or undefined
  if (wofData.properties.hasOwnProperty(langProperty) &&
    !_.isEmpty(wofData.properties[langProperty]) &&
    wofData.properties[langProperty] !== 'unk' &&
    wofData.properties[langProperty] !== 'und' &&
    !_.isEqual(wofData.properties[langProperty], ['unk']) &&
    !_.isEqual(wofData.properties[langProperty], ['und'])) {


    // check if that language is available
    var name = getPropertyValue(wofData, langProperty);
    if (name) {
      return name;
    }

    // if corresponding name property wasn't found, log the error
    logger.warn(langProperty, '[missing]', wofData.properties['wof:name'],
      wofData.properties['wof:placetype'], wofData.properties['wof:id']);
  }
  return false;
}

/**
 * Get the string value of the property or false if not found
 *
 * @param {object} wofData
 * @param {string} property
 * @returns {boolean|string}
 */
function getPropertyValue(wofData, property) {

  if (wofData.properties.hasOwnProperty(property)) {

    // if the value is an array, return the first item
    if (wofData.properties[property] instanceof Array) {
      return wofData.properties[property][0];
    }

    // otherwise just return the value as is
    return wofData.properties[property];
  }
  return false;
}

module.exports = getName;