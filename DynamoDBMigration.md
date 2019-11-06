## Migrate the data to Dynamo

Prerequisite is to turn off any throttling on the DynamoDB, temporarily

1.  Download the migration-tools.zip from here:  https://github.com/topcoder-platform/topcoder-x-ui/issues/140#issuecomment-497663806
2.  Unzip
3.  Modify `migration-tools/config/default.js` to match prod
  * MONGODB_URL: Will provide in Slack
  * AWS_ACCESS_KEY_ID
  * AWS_SECRET_ACCESS_KEY
  * AWS_REGION
  * IS_LOCAL = 'false'
4.  `npm i`
5.  `npm run migrate-data`

#### Tables created

* `Topcoder_X.CopilotPayment`
* `Topcoder_X.Issue`
* `Topcoder_X.OwnerUserGroup`
* `Topcoder_X.OwnerUserTeam`
* `Topcoder_X.Project`
* `Topcoder_X.User`
* `Topcoder_X.UserMapping`


## Deploy latest code

* Deploy the latest code from `master` to Heroku:
  * topcoder-x-receiver
  * topcoder-x-processor
  * topcoder-x-ui

Update the AWS Dynamo config values in Heroku:

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
* IS_LOCAL='false'
* AWS_DYNAMODB_REGION
* AWS_REGION
