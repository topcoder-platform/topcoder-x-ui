/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
/**
 * This module is a wrapper for kafka producer.
 *
 * @author TCSCODER
 * @version 1.0
 */


const {promisify} = require('util');
const kafka = require('kafka-node');
const config = require('../config');
const logger = require('../common/logger');

class Kafka {
  constructor() {
    this.client = new kafka.KafkaClient(config.KAFKA_OPTIONS);
    this.producer = new kafka.Producer(this.client);
    this.producer.on('ready', () => {
      logger.info('kafka producer is ready.');

      this.producer.createTopics([config.TOPIC], true, (err) => {
        if (err) {
          logger.error(`error in creating topic: ${config.TOPIC}, error: ${err.stack}`);
        } else {
          logger.info(`kafka topic: ${config.TOPIC} is ready`);
        }
      });
    });
    this.producer.on('error', (err) => {
      logger.error(`kafka is not connected. ${err.stack}`);
    });
    this.sendAsync = promisify(this.producer.send).bind(this.producer);
  }
  send(message) {
    return this.sendAsync([{topic: config.TOPIC, messages: message}]);
  }
}

module.exports = new Kafka();
