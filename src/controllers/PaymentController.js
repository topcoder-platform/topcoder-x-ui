/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes payment endpoints.
 *
 * @author kevinkid
 * @version 1.0
 */
const helper = require('../common/helper');
const PaymentService = require('../services/PaymentService');

/**
 * update payments status
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Promise} fetch payment updates execution
 */
async function updateAll(req) {
    return await PaymentService.updateAll(req.currentUser);
}

/**
 * get all the payment for the current copilot
 * @param {Object} req the request
 * @param {Object} res  the response
 * @returns {Object} the result
 */
async function getAll(req) {
    const payments = await PaymentService.getAll(req.query);
    const active = [];
    const closed = [];

    payments.forEach(function (payment) {
        if (payment.closed === "true") {
            closed.push(payment);
        } else {
            active.push(payment);
        }
    });
    return { activePayments: active, closedPayments: closed };
}

/**
 * create payment
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
    return await PaymentService.create(req.currentUser, req.body.payment);
}

/**
 * update payment item
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function update(req) {
    return await PaymentService.update(req.currentUser, req.body.payment);
}

/**
 * remove payment item
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function remove(req) {
    return await PaymentService.remove(req.params.id, req.currentUser);
}


module.exports = {
    getAll,
    create,
    update,
    remove,
    updateAll
};

helper.buildController(module.exports);
