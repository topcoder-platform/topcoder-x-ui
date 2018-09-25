/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Schema for Issue.
 * @author TCSCODER
 * @version 1.0
 */
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // From the receiver service
  number: {type: Number, required: true},
  title: {type: String, required: true},
  body: String,
  prizes: [{type: Number, required: true}], // extracted from title
  provider: {type: String, required: true}, // github or gitlab
  repositoryId: {type: Number, required: true},
  labels: [{type: String, required: true}],
  assignee: {type: String, required: false},
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // From topcoder api
  challengeId: {type: Number, required: false, unique: true, sparse: true},
  projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  assignedAt: {type: Date, required: false},
});

// Issue number, provider, repositoryId must be unique
schema.index({number: 1, provider: 1, repositoryId: 1}, {unique: true});
schema.index({labels: 1});
schema.index({projectId: 1});

schema.pre('save', function preSave(next) {
  this.updatedAt = Date.now(); // eslint-disable-line
  return next();
});
module.exports = schema;
