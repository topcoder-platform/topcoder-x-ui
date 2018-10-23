/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
const fs = require('fs');
/**
 * Define config.
 *
 * @author TCSCODER
 * @version 1.0
 */
module.exports = {
  PORT: process.env.PORT || 80, // eslint-disable-line no-magic-numbers
  API_VERSION: process.env.API_VERSION || 'v1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/topcoderx',
  SESSION_SECRET: process.env.SESSION_SECRET || 'kjsdfkj34857',
  // Github and gitlab client id and secret
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || 'ae39bea2a2a23f1dd032',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || 'f31dd2da12015f60372a5312a40a06b517a88702',
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID || 'af4c1ea3d12783e55470a6604c169b2cdc03734c7e3969f7f4336325f6e0e6b4',
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET || '8906a8e924df81ddadd12b37ee98767cfba3084ca3c9d52a5753412da8d9879e',

  // used as base to construct various URLs
  WEBSITE: process.env.WEBSITE || 'http://topcoderx.topcoder-dev.com',
  GITLAB_API_BASE_URL: process.env.GITLAB_API_BASE_URL || 'https://gitlab.com',
  // kafka configuration
  TOPIC: process.env.TOPIC || 'tc-x-events',
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_HOST || 'localhost:9092',
    ssl: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
      passphrase: 'secret', // NOTE:* This configuration specifies the private key passphrase used while creating it.
    },
  },
  HOOK_BASE_URL: process.env.HOOK_BASE_URL || 'http://topcoderx.topcoder-dev.com',
  TOPCODER_ENV: process.env.TOPCODER_ENV || 'dev',
  LABELS: process.env.LABELS || [{ name: 'tcx_OpenForPickup', color: '428BCA' }, { name: 'tcx_Assigned', color: '004E00' }, { name: 'tcx_ReadyForReview', color: 'D1D100' }, { name: 'tcx_Paid', color: '7F8C8D' }, { name: 'tcx_Feedback', color: 'FF0000' }, { name: 'tcx_FixAccepted', color: '69D100' },
   {name:'tcx_NotReady', color: '000000'}],
  ALLOWED_TOPCODER_ROLES: process.env.ALLOWED_TOPCODER_ROLES || ['administrator', 'admin', 'connect manager', 'connect admin', 'copilot', 'connect copilot'],
  COPILOT_ROLE: process.env.COPILOT_ROLE || 'copilot',
  HELP_LINK: process.env.HELP_LINK || 'https://github.com/topcoder-platform/topcoder-x-ui/wiki',
  ADMINISTRATOR_ROLES: process.env.ADMINISTRATOR_ROLES || ['administrator', 'admin'],
};
