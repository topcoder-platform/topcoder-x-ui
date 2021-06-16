# Topcoder X overview

Topcoder-X is a set of applications and services that allow a copilot or Topcoder customer to manage work directly through Gitlab or Github.  When an issue is created in a Gitlab or Github project set up in Topcoder-X, Topcoder-X will create a Topcoder challenge to mirror the Gitlab or Github issue, and it will ensure that the challenge has the correct prize, copilot, assignee, description, and title.  As the Gitlab or Github issue is updated, Topcoder-X will ensure that the Topcoder challenge associated with the issue is updated appropriately.  When the Gitlab or Github issue is closed, Topcoder-X will activate and close the Topcoder challenge, ensuring that the members get paid as expected.

At each step of the process, Topcoder-X will add comments to the Gitlab or Github project, ensuring that the members know where the Topcoder challenge is and what the status of the challenge is.

The information is updated in real time based on webhook integrations with Gitlab and Github.  Each Gitlab or Github project will have a webhook registered that sends information about issues created, updated, assigned, and deleted back to Topcoder-X for processing.

# Deployment of the TopcoderX stack

## Dependencies
* NodeJS 8+
* DynamoDB
* Kafka
* nodemon (for local development)

## Topcoder-X pieces

Topcoder-X comprises 3 pieces:

* Topcoder-X Receiver which is called from Github and Gitlab via webhooks.  Github and Gitlab projects are set up with a webhook integration that calls from Github or Gitlab to the Topcoder-X receiver when events are raised.  The receiver reformats the messages into standard formats and puts them into a Kafka queue for later processing
* Topcoder-X Processor that handles the messages created by the receiver.  The processor handles the interactions with the Topcoder platform, via the Topcoder challenge API, and it also handles adding comments back to Github / Gitlab when things are updated on the Topcoder challenge.
* Topcoder-X UI that allows copilots and others to manage the Topcoder-X integrations with Github and Gitlab projects.  The user can add new Github and Gitlab integrations, including setting up default webhooks and labels for issues, all through the UI.

All 3 pieces will be configured to use the same DynamoDB and Kafka installations.


## DynamoDB

The DynamoDB can be created using default options.  Just make sure that it is configured properly as `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `IS_LOCAL` in all 3 pieces:

* Topcoder-X processor
* Topcoder-X receiver
* Topcoder-X UI

Sample from our local development environment:
```
AWS_ACCESS_KEY_ID: 'FAKE_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY: 'FAKE_SECRET_ACCESS_KEY'
AWS_REGION: 'FAKE_REGION'
IS_LOCAL: true
```
## Kafka

Installing Kafka can be done either locally or using a cloud service.  You'll need to note how the service is configured and will have to update the configuration appropriately for the receiver, processor, and site.

#### Local installation:

https://devops.profitbricks.com/tutorials/install-and-configure-apache-kafka-on-ubuntu-1604-1/

Make sure to install Kafka and also create an appropriate `topic`.  I use `topcoder-x` as the topic name in our development environment.

#### Local configuration

This is a sample configuration from our development environment.  The CERT and CERT_KEY are used for SSL connections, which likely won't apply locally - see below.  The TOPIC value is the Kafka topic created during installation.

```
KAFKA_CLIENT_CERT: <cert string>

KAFKA_CLIENT_CERT_KEY: <cert string>

KAFKA_URL: silver-craft-01.srvs.cloudkafka.com:9093,silver-craft-01.srvs.cloudkafka.com:9094

KAFKA_GROUP_ID: topcoder-x-processor

TOPIC: topcoder-x
```

For local development, you don't need the CERT and CERT_KEY values.  For the processor and receiver you can update the `config/default.js` file and remove the `ssl` section under `KAFKA_OPTIONS`

So it would be updated from this:

```
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_URL || 'localhost:9092',
    groupId: process.env.KAFKA_GROUP_ID || 'topcoder-x-processor',
    ssl: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
    }
  },
```

To this:

```
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_URL || 'localhost:9092',
    groupId: process.env.KAFKA_GROUP_ID || 'topcoder-x-processor'
  },
```

## Machine-to-machine (M2M) Token generation
The `topcoder-x-processor` uses the Topcoder m2m token to interact with others Topcoder service.
It needs to be configured properly. Please make sure the following items is configured:

- `AUTH0_URL` The Auth0 URL for generating Machine-to-machine token
- `AUTH0_AUDIENCE` The audience of Auth0 to generate M2M Token
- `AUTH0_CLIENT_ID` The Auth0 ClientID for generating Machine-to-machine token
- `AUTH0_CLIENT_SECRET` The Auth0 Client Secret for generating Machine-to-machine token


For local deployment, configuring M2M token generation can use this provided account:
```
export AUTH0_URL=https://topcoder-dev.auth0.com/oauth/token
export AUTH0_AUDIENCE=https://m2m.topcoder-dev.com/
export AUTH0_CLIENT_ID=
export AUTH0_CLIENT_SECRET=
```


## Local DNS setup

For login to work, your local Topcoder-X-UI deployment needs to have a `*.topcoder-dev.com` DNS name.  Our development environment uses `x.topcoder-dev.com`

You can make this change in your local `/etc/hosts` file.

```
127.0.0.1   x.topcoder-dev.com
```

You can login with one of these sample accounts:

* `mess` / `appirio123`
* `tonyj` / `appirio123`

## Local webhook setup

The hardest part of the setup may be ensuring that Gitlab and Github can make callbacks to your local environment.  You will have to ensure that your Topcoder-X receiver is publicly accessible on the public internet.

If your ISP dynamically configures your IP address, you can use a dyndns service:

* https://www.duckdns.org/
* https://www.noip.com/

Once you have your local Topcoder-X receiver publicly accessible, you can add a webhook like this.  Note that you can also do this through the UI - just make sure to properly set the `HOOK_BASE_URL` config property of the Topcoder-X UI to match your publicly accessible domain name.

#### Gitlab

```
http://<publicly accessible domain name>:<port>/webhooks/gitlab
```

#### Github

```
https://<publicly accessible domain name>:<port>/webhooks/github
```

## Account setup

Once all 3 services are running, you should be able to login to the Topcoder-X UI.  The first thing to do is set up the Gitlab and Github account mapping for your account.

You can do this by clicking your logged in username in the upper right of the Topcoder-X UI and clicking `Settings`.  This will allow you to register with both Github and Gitlab.  Both should show a check mark indicating they have been properly set up.

## Testing

Once you have registered your account, go into `Project Management` and add a new project for either a Gitlab or Github project you have access to.  Gitlab is likely easier for testing - you can create a free test project under your own account.

Use Topcoder Connect ID `16665` since this has a valid billing account in the dev environment.

Once it's been added, click `Manage` for the project in the list on `Project Management` and click `Add Webhooks`.  Once the webhook has been added, you should be able to see it in the Gitlab project under `Settings` --> `Integrations` --> `Webhooks`

To test the webhook, create a new issue in the project with a title like `[$1] This is a test issue`

You should see the message passed successfully from the webhook to the receiver and then processed.

If the flow works properly, you will see a comment like this added to the Gitlab issue:

```
Contest https://www.topcoder-dev.com/challenges/30052039 has been created for this ticket.
```

You can test assignment by assigning the ticket to yourself.  You should then see another message after a few seconds like this:

```
Contest https://www.topcoder-dev.com/challenges/30052039 has been updated - it has been assigned to tonyj.
```

## Sample development configs

For reference, this is what the sample configs look like in our development environment, which should closely match your local deployment environment.

You can use the Gitlab and Github keys and secrets below, but you are also welcome to create your own.

#### Topcoder-X processor
```
Justins-Mac-Pro:~ justingasper$ heroku config --app topcoder-x-processor-dev
=== topcoder-x-processor-dev Config Vars
EMAIL_SENDER_ADDRESS:         bidbot@mail.x.topcoder-dev.com
ISSUE_BID_EMAIL_RECEIVER:     cwd@topcoder.com
KAFKA_CLIENT_CERT: <cert>
KAFKA_CLIENT_CERT_KEY: <key>
KAFKA_URL:                   silver-craft-01.srvs.cloudkafka.com:9093,silver-craft-01.srvs.cloudkafka.com:9094
KAFKA_GROUP_ID                topcoder-x-processor
LOG_LEVEL:                    debug
MAILGUN_SMTP_LOGIN:           postmaster@mail.x.topcoder-dev.com
MAILGUN_SMTP_PASSWORD:        c8aefb446e76febdbc31d57ef30b9c10
MAILGUN_SMTP_PORT:            587
MAILGUN_SMTP_SERVER:          smtp.mailgun.org
NODE_DEBUG:                   app
NODE_ENV:                     development
NODE_MODULES_CACHE:           false
NODE_TLS_REJECT_UNAUTHORIZED: 0
TOPIC:                        topcoder-x
AWS_ACCESS_KEY_ID:  FAKE_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY: FAKE_SECRET_ACCESS_KEY
AWS_REGION: FAKE_REGION
IS_LOCAL: true
AUTH0_URL:                    https://topcoder-dev.auth0.com/oauth/token
AUTH0_AUDIENCE:               https://m2m.topcoder-dev.com/
AUTH0_CLIENT_ID:              <client id>
AUTH0_CLIENT_SECRET:          <secret>
```

#### Topcoder-X receiver

```
Justins-Mac-Pro:~ justingasper$ heroku config --app topcoder-x-receiver-dev
=== topcoder-x-receiver-dev Config Vars
KAFKA_CLIENT_CERT: <cert>
KAFKA_CLIENT_CERT_KEY: <key>
KAFKA_URL:                   silver-craft-01.srvs.cloudkafka.com:9093,silver-craft-01.srvs.cloudkafka.com:9094
LOG_LEVEL:                    debug
NODE_ENV:                     development
NODE_TLS_REJECT_UNAUTHORIZED: 0
TOPIC:                        topcoder-x
AWS_ACCESS_KEY_ID:  FAKE_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY: FAKE_SECRET_ACCESS_KEY
AWS_REGION: FAKE_REGION
IS_LOCAL: true
```

#### Topcoder-X UI

```
Justins-Mac-Pro:~ justingasper$ heroku config --app topcoder-x-ui-dev
=== topcoder-x-ui-dev Config Vars
BUILD_ENV:             heroku
GITHUB_CLIENT_ID:
GITHUB_CLIENT_SECRET:
GITLAB_CLIENT_ID:
GITLAB_CLIENT_SECRET:
HOOK_BASE_URL:         https://topcoder-x-receiver-dev.herokuapp.com
KAFKA_CLIENT_CERT:  <cert>
KAFKA_CLIENT_CERT_KEY: <key>
KAFKA_URL:            silver-craft-01.srvs.cloudkafka.com:9093,silver-craft-01.srvs.cloudkafka.com:9094
NPM_CONFIG_PRODUCTION: false
SESSION_SECRET:        kjsdfkj34857
TOPIC:                 topcoder-x
WEBSITE:               https://x.topcoder-dev.com
AWS_ACCESS_KEY_ID:  FAKE_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY: FAKE_SECRET_ACCESS_KEY
AWS_REGION: FAKE_REGION
IS_LOCAL: true
TC_LOGIN_URL: https://accounts-auth0.topcoder-dev.com/
```
