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

const CopilotPayment = models.CopilotPayment;
const Project = models.Project;

const getAllPaymentsSchema = {
  query: Joi.object().keys({
    sortBy: Joi.string().valid('project', 'amount', 'challenge').required()
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
 * gets all payments
 * @param {String} query query param
 * @param {Object} topcoderUser the topcoder user details of logged in user
 * @returns {Array} copilot payments
 */
async function getAll(query, topcoderUser) {
  const condition = { username: topcoderUser.handle };
  const payments = await CopilotPayment.find(condition)
    .populate({ path: 'project', select: 'title' });

  // sort by query criteria
  return await _.orderBy(payments, query, ['desc']);
}

getAll.schema = getAllPaymentsSchema;

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
  return {success: true};
}

updateAll.schema = {
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required()
  }
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
  await helper.ensureExists(Project, payment.project);

  payment.username = topcoderUser.handle;
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
  let dbPayment = await helper.ensureExists(CopilotPayment, payment.id);

  if (dbPayment.username !== topcoderUser.handle) {
    throw new Error('You do not have permission to edit this payment');
  }
  if (dbPayment.closed === true) {
    throw new Error('Closed payment can not be updated');
  }

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
  const dbPayment = await helper.ensureExists(CopilotPayment, id);
  if (dbPayment.username !== topcoderUser.handle) {
    throw new Error('You do not have permission to remove this payment');
  }
  if (dbPayment.closed === true) {
    throw new Error('Closed payment can not be removed');
  }

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
  return {success: true};
}

remove.schema = removePaymentSchema;


module.exports = {
  getAll,
  create,
  update,
  remove,
  updateAll,
};

helper.buildService(module.exports);
