const AWS = require('aws-sdk');
const helper = require('../src/common/helper');
const dbHelper = require('../src/common/db-helper');
const Project = require('../src/models').Project;

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
            item.repoUrls = [item.repoUrl];
            await dbHelper.update(Project, item.id, item);
        });
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    } while(typeof items.LastEvaluatedKey !== 'undefined');
})();