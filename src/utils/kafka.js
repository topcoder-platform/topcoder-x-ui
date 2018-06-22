/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
/**
 * This module is a wrapper for kafka producer.
 *
 * @author TCSCODER
 * @version 1.0
 */


const kafka = require('no-kafka');
const config = require('../config');
const logger = require('../common/logger');

class Kafka {
  constructor() {
    this.producer = new kafka.Producer(config.KAFKA_OPTIONS);
    this.producer.init().then(() => {
      logger.info('kafka producer is ready.');
    }).catch((err) => {
      logger.error(`kafka is not connected. ${err.stack}`);
    });
  }

  send(message) {
    return this.producer.send({ topic: config.TOPIC, message: { value: message } });
  }
}

module.exports = new Kafka();
