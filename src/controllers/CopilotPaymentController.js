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
const CopilotPaymentService = require('../services/CopilotPaymentService');

/**
 * update payments status
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Promise} fetch payment updates execution
 */
async function updateAll(req) {
    return await CopilotPaymentService.updateAll(req.currentUser);
}

/**
 * searches the payment according to criteria for the current copilot
 * @param {Object} req the request
 * @param {Object} res  the response
 * @returns {Object} the result
 */
async function search(req) {
    return await CopilotPaymentService.search(req.query, req.currentUser);
}

/**
 * create payment
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
    return await CopilotPaymentService.create(req.currentUser, req.body.payment);
}

/**
 * update payment item
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function update(req) {
    return await CopilotPaymentService.update(req.currentUser, req.body.payment);
}

/**
 * remove payment item
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function remove(req) {
    return await CopilotPaymentService.remove(req.params.id, req.currentUser);
}


module.exports = {
    search,
    create,
    update,
    remove,
    updateAll
};

helper.buildController(module.exports);
