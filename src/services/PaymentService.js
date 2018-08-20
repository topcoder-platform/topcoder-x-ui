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

const Payment = models.Payment;
const Project = models.Project;

const getAllPaymentsSchema = {
  query: Joi.object().keys({
      sortBy: Joi.string().valid('project', 'amount', 'challenge').required()
  }).required()
};

const paymentSchema = {
  payment: {
    id: Joi.string().optional(),
    project: Joi.string().required(),
    amount: Joi.number().required(),
    description: Joi.string().required(),
    challenge: Joi.number().required(),
    closed: Joi.string().required(),
  },
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required()
  },
};

const createPaymentSchema = {
  payment: {
    project: Joi.string().required(),
    amount: Joi.number().required(),
    description: Joi.string().required(),
    challenge: Joi.number().required(),
  },
  topcoderUser: {
    handle: Joi.string().required(),
    roles: Joi.array().required()
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
 * retrieve copilot details
 * @param {Object} tcUser topcoder user details
 * @returns {Object} topcoder user object if role is of copilot
 */
async function getCopilotUser(tcUser) {
  if (_.includes(tcUser.roles, 'copilot')) {
    return tcUser;
  } else {
    return null;
  }
}


/**
 * add project title property for table display
 * @param {Object} payments db payments
 * @param {Object} projects db projects
 * @returns {Array} changed payment items
 */
async function setProjectTitle(payments, projects) {
  const newPayments = [];
  if (payments && projects) {
    await payments.forEach(function (payment) {
      const _payment = payment.toJSON();
      const project = _.find(projects, { 'id': _payment.project });
      _payment.projectTitle = project.title;
      newPayments.push(_payment);
    });
  }
  return newPayments;
}

/**
 * gets all payments
 * @param {String} query query param
 * @returns {Array} copilot payments
 */
async function getAll(query) {

  let payments = await Payment.find();
  let projects = await Project.find();
  payments = await setProjectTitle(payments, projects);

  // sort by query criteria
  return await _.orderBy(payments, query, ['desc']);
}

getAll.schema = getAllPaymentsSchema;

/**
 * update payments list
 * @returns {Promise} sending kafka message execution
 */
async function updateAll() {
  var paymentUpdatesEvent = {
    "event": "payment.checkUpdates"
  };
  return await kafka.send(JSON.stringify(paymentUpdatesEvent));
}


/**
 * creates payment
 * @param {Object} topcoderUser topcoder user details
 * @param {Object} payment details
 * @returns {Object} created payment
 */
async function create(topcoderUser, payment) {
  const dbProjectExist = await helper.ensureExists(Project, payment.project);
  const copilot = await getCopilotUser(topcoderUser);
  if (dbProjectExist) {
    const dbPayment = new Payment(payment);
    const paymentCreateEvent = {
      "event": "payment.add",
      "data": {
        "payment": payment,
        "copilot": copilot
      }
    };
    await dbPayment.save();
    payment.id = dbPayment._id;
    return await kafka.send(JSON.stringify(paymentCreateEvent));
  } else {
    return {};
  }
}

create.schema = createPaymentSchema;

/**
 * updates payment
 * @param {Object} topcoderUser topcoder user details
 * @param {Object} payment the payment detail
 * @returns {Any} payment update execution
 */
async function update(topcoderUser, payment) {
  const dbPayment = await helper.ensureExists(Payment, payment.id); // NOTE:* Make sure the project exist and also the project is active in this case. You can also create a new helper method 'projectExistAndAcive'
  const copilot = getCopilotUser(topcoderUser);
  if (dbPayment) {

    Object.entries(payment).map((item) => {
      dbPayment[item[0]] = item[1];
      return item;
    });
    payment.id = dbPayment._id;
    const paymentUpdateEvent = {
      "event": "payment.update",
      "data": {
        "payment": payment,
        "copilot": copilot
      }
    };
    return await kafka.send(JSON.stringify(paymentUpdateEvent));
  } else {
    throw new Error(`Error - project [${payment.project}] does not exsist in topcoderx.
        Ensure you are creating payment that has a cooresponding existing topcoderx project.`);
  }
}

update.schema = paymentSchema;


/**
 * delete payment item
 * @param {object} id payment id
 * @param {Object} topcoderUser topcoder user details
 */
async function remove(id, topcoderUser) {
  const dbPayment = await helper.ensureExists(Payment, id);
  const copilot = await getCopilotUser(topcoderUser);
  const payment = dbPayment.toJSON();
  payment.id = dbPayment._id;
  delete payment._id;

  if (dbPayment) {
    const paymentDeleteEvent = {
      "event": "payment.delete",
      "data": {
        "payment": payment,
        "copilot": copilot
      }
    };
    await Payment.deleteOne(id);
    await kafka.send(JSON.stringify(paymentDeleteEvent));
    return;
  } else {
    throw new Error('Trying to delete non-existing payment item.');
  }
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
