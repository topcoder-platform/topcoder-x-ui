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
const _ = require('lodash');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwtDecode = require('jwt-decode');
const config = require('./config');
const routes = require('./routes');
const logger = require('./common/logger');
const errors = require('./common/errors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: config.SESSION_SECRET, resave: false, saveUninitialized: true }));
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
    actions.push((req, res, next) => {
      const v3jwt = _.get(req.cookies, 'v3jwt');
      if (v3jwt) {
        const decoded = jwtDecode(v3jwt);
        req.currentUser = {
          handle: decoded.handle.toLowerCase(),
        };
      }
      req.signature = `${def.controller}#${def.method}`;
      next();
    });
    if (def.tcLogin) {
      // middleware to handle TC login
      actions.push((req, res, next) => {
        if (req.session.tcLoginDone) {
          req.session.tcLoginDone = null;
          return next();
        }
        req.session.tcLoginReturnUrl = req.originalUrl;
        const callbackUri = `${config.WEBSITE}${config.TC_LOGIN_CALLBACK_URL}`;
        return res.redirect(`${config.TC_LOGIN_URL}?retUrl=${encodeURIComponent(callbackUri)}`);
      });
    }
    actions.push(method);
    app[verb](`/api/${config.API_VERSION}${path}`, actions);
  });
});

// static content
app.use(express.static(Path.join(__dirname, 'public')));
// mount the angular app
app.use('*', express.static(Path.join(__dirname, 'public')));

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
      _.map(err.details, (detail) => ({ message: detail.message, path: detail.path })));
  }
  // from express-jwt
  if (err.name === 'UnauthorizedError') {
    err.statusCode = 401; // eslint-disable-line no-magic-numbers
  }

  const resObj = { message: resultErr.message };
  if (resultErr.code) {
    resObj.code = resultErr.code;
  }
  if (resultErr.details) {
    resObj.details = resultErr.details;
  }
  res.status(resultErr.statusCode || 500).json(resObj); // eslint-disable-line no-magic-numbers
});

const port = config.PORT;
app.listen(port, '0.0.0.0');
logger.info('Topcoder X server listening on port %d', port);

module.exports = app;
