const AWS = require('aws-sdk');
const helper = require('../src/common/helper');
const dbHelper = require('../src/common/db-helper');
const Project = require('../src/models').Project;
const Repository = require('../src/models').Repository;

if (process.env.IS_LOCAL=="true") {
    AWS.config.update({
        endpoint: 'http://localhost:8000'
    });
}
var documentClient = new AWS.DynamoDB.DocumentClient();

(async () => {
    console.log('Migrating...');
    const params = {
        TableName: 'Topcoder_X.Project'
    };

    let items;
    do {
        items = await documentClient.scan(params).promise();
        items.Items.forEach(async (item) => {
            console.log(item);
            let repoUrls;
            if (item.repoUrls) {
                repoUrls = item.repoUrls.values;
            }
            else {
                repoUrls = [item.repoUrl];
            }
            for (const url of repoUrls) { // eslint-disable-line
                console.log(`Creating ${url}`);
                await dbHelper.create(Repository, {
                    id: helper.generateIdentifier(),
                    projectId: item.id,
                    url,
                    archived: item.archived,
                    registeredWebhookId: item.registeredWebhookId
                });
            }
        });
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    } while(typeof items.LastEvaluatedKey !== 'undefined');
})();