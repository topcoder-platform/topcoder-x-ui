/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide project operations.
 *
 * @author TCSCODER
 * @version 1.0
 */
const Joi = require('joi');
const _ = require('lodash');
const helper = require('../common/helper');
const models = require('../models');
const kafka = require('../utils/kafka');
const errors = require('../common/errors');

const CopilotPayment = models.CopilotPayment;
const Project = models.Project;

// payment search schema
const searchSchema = {
  criteria: Joi.object().keys({
    status: Joi.boolean().required(),
    sortBy: Joi.string().valid('project', 'amount', 'challenge').required(),
    sortDir: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).required(),
    perPage: Joi.number().integer().min(1).required(),
  }).required(),
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required(),
  },
};

const paymentSchema = {
  payment: {
    id: Joi.string().optional(),
    project: Joi.string().required(),
    amount: Joi.number().required(),
    description: Joi.string().required(),
  },
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required(),
  },
};

const createPaymentSchema = {
  payment: {
    project: Joi.string().required(),
    amount: Joi.number().required(),
    description: Joi.string().required(),
  },
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required(),
  },
};

const removePaymentSchema = {
  id: Joi.string().required(),
  topcoderUser: Joi.object().keys({
    handle: Joi.string().required(),
    roles: Joi.array().required(),
  }),
};

/**
 * ensure if current user can update the copilot payment
 * if has access then get information
 * @param {String} paymentId the payment id
 * @param {Object} topcoderUser the topcoder current user
 * @returns {Object} the project and payment detail from database
 * @private
 */
async function _ensureEditPermissionAndGetInfo(paymentId, topcoderUser) {
  const dbPayment = await helper.ensureExists(CopilotPayment, paymentId);
  const dbProject = await helper.ensureExists(Project, dbPayment.project);
  // either user must be owner of project or user is copilot receiving payment
  if (dbPayment.username !== topcoderUser.handle && dbProject.owner !== topcoderUser.handle) {
    throw new errors.ForbiddenError('You do not have permission to edit this payment');
  }
  if (dbPayment.closed === true) {
    throw new Error('Closed payment can not be updated');
  }
  return dbPayment;
}

/**
 * searches payments
 * @param {Object} criteria the search criteria
 * @param {Object} topcoderUser the topcoder user details of logged in user
 * @returns {Array} copilot payments
 */
async function search(criteria, topcoderUser) {
  const projectIds = await Project.find({
    $or: [
      { owner: topcoderUser.handle },
      { copilot: topcoderUser.handle },
    ],
  }).select('_id');
  const condition = { project: { $in: projectIds } };
  condition.closed = criteria.status;
  const payments = await CopilotPayment.find(condition)
    .populate({ path: 'project', select: 'title owner copilot' });
  const offset = (criteria.page - 1) * criteria.perPage;
  const result = {
    pages: Math.ceil(payments.length / criteria.perPage) || 1,
    docs: _(payments).orderBy(criteria.sortBy, criteria.sortDir)
      .slice(offset).take(criteria.perPage)
      .value(),
  };
  return result;
}

search.schema = searchSchema;

/**
 * update payments list
 * @param {Object} topcoderUser topcoder user details
 * @returns {Object} the success status
 */
async function updateAll(topcoderUser) {
  const paymentUpdatesEvent = {
    event: 'copilotPayment.checkUpdates',
    data: {
      copilot: topcoderUser,
    },
  };
  await kafka.send(JSON.stringify(paymentUpdatesEvent));
  return { success: true };
}

updateAll.schema = {
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required(),
  },
};

/**
 * gets the existing payments to get the latest challenge id
 * @param {Object} dbPayment the payment
 * @returns {Object} the updated payment
 */
async function getExistingChallengeIdIfExists(dbPayment) {
  // check if there is existing active challenge associated with this project
  const existingPayments = await CopilotPayment.findOne({
    project: dbPayment.project,
    username: dbPayment.username,
    closed: false,
    challengeId: {
      $gt: 0,
    },
  });
  // if no existing challenge found then it will be created by processor
  if (existingPayments) {
    dbPayment.challengeId = existingPayments.challengeId;
  }
  return dbPayment;
}

/**
 * creates payment
 * @param {Object} topcoderUser topcoder user details
 * @param {Object} payment details
 * @returns {Object} created payment
 */
async function create(topcoderUser, payment) {
  const dbProject = await helper.ensureExists(Project, payment.project);
  if (dbProject.copilot !== topcoderUser.handle && dbProject.owner !== topcoderUser.handle) {
    throw new errors.ForbiddenError('You do not have permission to edit this payment');
  }
  payment.username = dbProject.copilot;
  payment.closed = false;
  let dbPayment = new CopilotPayment(payment);

  dbPayment = await getExistingChallengeIdIfExists(dbPayment);
  if (!_.isNumber(dbPayment.challengeId) && payment.amount <= 1) {
    throw new Error('The amount must be greater than 1');
  }
  await dbPayment.save();
  const paymentCreateEvent = {
    event: 'copilotPayment.add',
    data: {
      payment: dbPayment.toObject(),
      copilot: topcoderUser,
    },
    provider: 'copilotPayment',
  };
  await kafka.send(JSON.stringify(paymentCreateEvent));
  return dbPayment.toJSON();
}

create.schema = createPaymentSchema;

/**
 * updates payment
 * @param {Object} topcoderUser topcoder user details
 * @param {Object} payment the payment detail
 * @returns {Object} updated detail
 */
async function update(topcoderUser, payment) {
  let dbPayment = await _ensureEditPermissionAndGetInfo(payment.id, topcoderUser);

  // if nothing is changed then discard
  if (dbPayment.project === payment.project && dbPayment.amount === payment.amount && dbPayment.description === payment.description) { // eslint-disable-line
    return dbPayment.toJSON();
  }

  const existingProjectId = dbPayment.project;
  const existingChallengeId = dbPayment.challengeId;

  if (existingProjectId !== payment.project) {
    dbPayment.challengeId = null;
    payment.challengeId = null;
  }

  dbPayment.amount = payment.amount;
  dbPayment.description = payment.description;
  dbPayment.project = payment.project;

  dbPayment = await getExistingChallengeIdIfExists(dbPayment);
  if (!_.isNumber(dbPayment.challengeId) && payment.amount <= 1) {
    throw new Error('The amount must be greater than 1');
  }
  await dbPayment.save();

  const paymentUpdateEvent = {
    event: dbPayment.challengeId > 0 ? 'copilotPayment.update' : 'copilotPayment.add',
    data: {
      payment: dbPayment.toObject(),
      copilot: topcoderUser,
    },
  };
  await kafka.send(JSON.stringify(paymentUpdateEvent));

  // if project is changed then existing challenge should be updated as well
  // so that amount is reduced from existing project
  if (existingProjectId !== payment.project) {
    const paymentDeleteEvent = {
      event: 'copilotPayment.update',
      data: {
        payment: {
          project: existingProjectId,
          challengeId: existingChallengeId,
        },
        copilot: topcoderUser,
      },
    };
    await kafka.send(JSON.stringify(paymentDeleteEvent));
  }
  return dbPayment.toJSON();
}

update.schema = paymentSchema;


/**
 * delete payment item
 * @param {object} id payment id
 * @param {Object} topcoderUser topcoder user details
 * @returns {Object} the success status
 */
async function remove(id, topcoderUser) {
  const dbPayment = await _ensureEditPermissionAndGetInfo(id, topcoderUser);

  const payment = await getExistingChallengeIdIfExists(dbPayment.toObject());
  await CopilotPayment.remove({ _id: id });

  const paymentDeleteEvent = {
    event: 'copilotPayment.delete',
    data: {
      payment,
      copilot: topcoderUser,
    },
  };

  await kafka.send(JSON.stringify(paymentDeleteEvent));
  return { success: true };
}

remove.schema = removePaymentSchema;


module.exports = {
  search,
  create,
  update,
  remove,
  updateAll,
};

helper.buildService(module.exports);
