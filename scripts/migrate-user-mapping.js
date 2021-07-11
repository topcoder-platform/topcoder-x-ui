const AWS = require('aws-sdk');
const helper = require('../src/common/helper');
const dbHelper = require('../src/common/db-helper');
const GithubUserMapping = require('../src/models').GithubUserMapping;
const GitlabUserMapping = require('../src/models').GitlabUserMapping;

if (process.env.IS_LOCAL) {
    AWS.config.update({
        endpoint: 'http://localhost:8000'
    });
}
var documentClient = new AWS.DynamoDB.DocumentClient();

(async () => {
    console.log('Migrating...');
    const params = {
        TableName: 'Topcoder_X.UserMapping'
    };

    let items;
    do {
        items = await documentClient.scan(params).promise();
        items.Items.forEach(async (item) => {
            console.log(item);
            if (item.githubUserId && item.githubUsername) {
                await dbHelper.create(GithubUserMapping, {
                    id: helper.generateIdentifier(),
                    topcoderUsername: item.topcoderUsername,
                    githubUserId: item.githubUserId,
                    githubUsername: item.githubUsername,
                });
            }
            if (item.gitlabUsername && item.gitlabUserId) {
                await dbHelper.create(GitlabUserMapping, {
                    id: helper.generateIdentifier(),
                    topcoderUsername: item.topcoderUsername,
                    gitlabUsername: item.gitlabUsername,
                    gitlabUserId: item.gitlabUserId,
                });
            }
        });
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    } while(typeof items.LastEvaluatedKey !== 'undefined');
})();