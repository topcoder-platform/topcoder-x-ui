/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the schema of a project registered with TC-X.
 *
 * @author TCSCODER
 * @version 1.0
 */


const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  project: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  challenge: { type: Number, required: true },
  closed: { type: String, required: true, default: "false" },
}, {
    toObject: {
      transform: function (doc, ret) {
        delete ret._id;
      }
    },
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
      }
    }
  });

schema.index({ tcDirectId: 1 });

module.exports = schema;
