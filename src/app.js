/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Main app script.
 *
 * @author TCSCODER
 * @version 1.0
 */
const Path = require('path');
const https = require('https');
const _ = require('lodash');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
// const secure = require('ssl-express-www');
const {decodeToken} = require('./utils/tc-auth');
const config = require('./config');
const routes = require('./routes');
const logger = require('./common/logger');
const errors = require('./common/errors');
const constants = require('./common/constants');
const {getAppHealth} = require('./controllers/AppHealthController');
global.atob = require('atob');

const app = express();
app.use(cors());
// app.use(secure);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: config.SESSION_SECRET, resave: false, saveUninitialized: true}));
app.use(cookieParser());

// Load routes
_.forEach(routes, (verbs, path) => {
  _.forEach(verbs, (def, verb) => {
    const controllerPath = Path.join(__dirname, `./controllers/${def.controller}`);
    const method = require(controllerPath)[def.method]; // eslint-disable-line global-require
    if (!method) {
      throw new Error(`${def.method} is undefined`);
    }
    const actions = [];
    if (!def.allowAnonymous) {
      actions.push((req, res, next) => {
        const v3jwt = _.get(req.cookies, constants.JWT_V3_NAME);
        if (v3jwt) {
          const decoded = decodeToken(v3jwt);
          req.currentUser = {
            handle: decoded.handle.toLowerCase(),
            roles: decoded.roles,
          };
        }
        req.signature = `${def.controller}#${def.method}`;
        next();
      });
    }
    if (def.tcLogin) {
      // middleware to handle TC login
      actions.push((req, res, next) => {
        if (req.session.tcLoginDone) {
          req.session.tcLoginDone = null;
          return next();
        }
        req.session.tcLoginReturnUrl = req.originalUrl;
        const callbackUri = `${config.WEBSITE}${constants.TC_LOGIN_CALLBACK_URL}`;
        return res.redirect(`${config.TOPCODER_VALUES[config.TOPCODER_ENV].TC_LOGIN_URL}?retUrl=${encodeURIComponent(callbackUri)}`);
      });
    }
    if (!def.allowNormalUser) {
      actions.push((req, res, next) => {
        // check if any allowed role is matched with user's roles
        if (_(req.currentUser.roles).map((i) => i.toLowerCase())
          .intersection(_.map(config.ALLOWED_TOPCODER_ROLES, (j) => j.toLowerCase())).size() === 0) {
          const statusCode = 403;
          return res.status(statusCode).json({
            code: 'Forbidden',
            message: 'You are not allowed to access this resource.',
          });
        }
        return next();
      });
    }
    if (def.allowedRoles) {
      actions.push((req, res, next) => {
        // check if user has allowed roles
        if (_(req.currentUser.roles).map((i) => i.toLowerCase())
          .intersection(_.map(def.allowedRoles, (j) => j.toLowerCase())).size() === 0) {
          const statusCode = 403;
          return res.status(statusCode).json({
            code: 'Forbidden',
            message: 'You are not allowed to access this resource.',
          });
        }
        return next();
      });
    }
    actions.push(method);
    app[verb](`/api/${config.API_VERSION}${path}`, actions);
  });
});

app.get(`/api/${config.API_VERSION}/health`, getAppHealth);

// static content
app.use(express.static(Path.join(__dirname, 'public')));
app.use('*', (req, res) => {
  res.redirect('/');
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.logFullError(err, req.signature);
  let resultErr = err;
  if (err.isJoi) {
    resultErr = new errors.ValidationError('Invalid request parameters',
      _.map(err.details, (detail) => ({message: detail.message, path: detail.path})));
  }
  // from express-jwt
  if (err.name === 'UnauthorizedError') {
    err.statusCode = 401; // eslint-disable-line no-magic-numbers
  }

  const resObj = {message: resultErr.message};
  if (resultErr.code) {
    resObj.code = resultErr.code;
  }
  if (resultErr.details) {
    resObj.details = resultErr.details;
  }
  res.status(resultErr.statusCode || 500).json(resObj); // eslint-disable-line no-magic-numbers
});

process.on('uncaughtException', (err) => {
  // Check if error related to Dynamodb conn
  if (err.code === 'NetworkingError' && err.region) {
    logger.error('DynamoDB connection failed.');
  }
  logger.logFullError(err, 'system');
});

// handle and log unhanled rejection
process.on('unhandledRejection', (err) => {
  logger.logFullError(err, 'system');
});

// dump the configuration to logger
const ignoreConfigLog = [
  'cert',
  'key',
  'ca',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITLAB_CLIENT_ID',
  'GITLAB_CLIENT_SECRET',
];
/**
 * Print configs to logger
 * @param {Object} params the config params
 * @param {Number} level the level of param object
 */
function dumpConfigs(params, level) {
  Object.keys(params).forEach((key) => {
    if (_.includes(ignoreConfigLog, key)) {
      return;
    }
    const item = params[key];
    let str = '';
    let n = 0;
    while (n < level) { // eslint-disable-line no-restricted-syntax
      n++;
      str += '  ';
    }
    if (item && _.isObject(item)) {
      str += `${key}=`;
      logger.debug(str);
      dumpConfigs(item, level + 1);
    } else {
      str += `${key}=${item}`;
      logger.debug(str);
    }
  });
}
logger.debug('--- List of Configurations ---');
dumpConfigs(config, 0);
logger.debug('--- End of List of Configurations ---');

const port = config.PORT;
if (process.env.ENABLE_SERVER_SSL) {
  https
    .createServer(config.SSL_CONFIG, app)
    .listen(port, () => {
      logger.info('Topcoder X server listening on port %d', port);
    });
} else {
  app.listen(port, '0.0.0.0');
}

module.exports = app;
