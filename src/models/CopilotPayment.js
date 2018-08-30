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
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  challengeId: { type: Number, required: false },
  closed: { type: Boolean, required: true, default: false },
  username: { type: String, required: true },
  status: { type: String },
}, {
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
      },
    },
  });

schema.index({ project: 1 });
schema.index({ username: 1 });
schema.index({ challengeId: 1 });
schema.index({ closed: 1 });

module.exports = schema;
