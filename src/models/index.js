/**
 * Initialize and exports all models.
 */
const Path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('../config');

mongoose.Promise = Promise;
const conn = mongoose.createConnection(config.MONGODB_URI);
const models = {};

// Bootstrap models
fs.readdirSync(__dirname).forEach((file) => { // eslint-disable-line no-sync
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    const schema = require(Path.join(__dirname, filename)); // eslint-disable-line global-require
    const model = conn.model(filename, schema);
    models[filename] = model;

    model.schema.options.minimize = false;
    model.schema.options.toJSON = {
      transform: (doc, ret) => {
        if (ret._id) {
          ret.id = String(ret._id);
          delete ret._id;
        }
        delete ret.__v;
        if (filename === 'Admin') {
          delete ret.password;
        }
        return ret;
      },
    };
  }
});

module.exports = models;
