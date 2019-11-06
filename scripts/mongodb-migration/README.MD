# Migrate mongodb to dynamodb
The following config parameters are supported, they are defined in `config/default.js` and can be configured in env variables:


| Name                                   | Description                                | Default                          |
| :------------------------------------- | :----------------------------------------: | :------------------------------: |
| LOG_LEVEL                              | The log level                              |  info                            |
| MONGODB_URL                            | The MongoDB URL.  This needs to be the same MongoDB used by topcoder-x-receiver, topcoder-x-processor, and topcoder-x-site                           | mongodb://127.0.0.1:27017/topcoderx |
|COLLECTION_COUNTS | The counts of testing data for each model| |
|AWS_ACCESS_KEY_ID | The Amazon certificate key to use when connecting. Use local dynamodb you can set fake value |FAKE_ACCESS_KEY_ID |
|AWS_SECRET_ACCESS_KEY | The Amazon certificate access key to use when connecting. Use local dynamodb you can set fake value |FAKE_SECRET_ACCESS_KEY |
|AWS_REGION | The Amazon certificate region to use when connecting. Use local dynamodb you can set fake value |FAKE_REGION |
|IS_LOCAL | Use Amazon DynamoDB Local or server | 'true' |
| MIGRATION_DELAY_TIME | The delay used to avoid throughput errors from DynamoDB | 5000 |
| MIGRATION_DELAY_INTERVAL | The number of requests made before we delay the next call to DynamoDB | 50 |

## Scripts

migrate mongodb data to dynamodb
```
npm run migrate-data
```

create empty tables to dynamodb
```
npm run create-empty-tables
```

## Test Data

**NOTE** This is a *destructive* call.  It will overwrite existing data in mongodb.  Do not do this against production

Create testing data to mongodb, this command will generate bulk fake data to testing migration.
You also can create regular data by opcoder-x-receiver/topcoder-x-processor/topcoder-x-site
```
npm run create-test-data
```
