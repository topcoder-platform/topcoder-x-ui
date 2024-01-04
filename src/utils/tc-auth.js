/* eslint-disable no-magic-numbers */
const _ = require('lodash');

/**
 * Decode the base64 string
 * @param {string} str the string to decode
 * @returns {string} the decoded string
 */
function urlBase64Decode(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');

  switch (output.length % 4) {
    case 0:
      break;

    case 2:
      output += '==';
      break;

    case 3:
      output += '=';
      break;

    default:
      throw new Error('Illegal base64url string!');
  }
  return decodeURIComponent(escape(atob(output))); // polyfill https://github.com/davidchambers/Base64.js
}

/**
 * Decode the token
 * @param {string} token The token to decode
 * @returns {object} The decoded token
 */
function decodeToken(token) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('The token is invalid');
  }

  const decoded = urlBase64Decode(parts[1]);

  if (!decoded) {
    throw new Error('Cannot decode the token');
  }

  // covert base64 token in JSON object
  const t = JSON.parse(decoded);

  // tweaking for custom claim for RS256
  t.userId = _.parseInt(_.find(t, (value, key) => _.includes(key, 'userId')));
  t.handle = _.find(t, (value, key) => _.includes(key, 'handle'));
  t.roles = _.find(t, (value, key) => _.includes(key, 'roles'));

  return t;
}

module.exports = {decodeToken};
