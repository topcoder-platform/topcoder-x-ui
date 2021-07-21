const dbHelper = require('../src/common/db-helper');
const helper = require('../src/common/helper');
const Organisation = require('../src/models').Organisation;

const args = process.argv;
if (args.length < 5) {
    console.log('Please provide data. Example: npm run add-organisation MyOrganisation ownername PAT-Token');
    return;
}
const organisationName = args[2];
const owner = args[3];
const pat = args[4];

(async () => {
    const dbOrganisation = await dbHelper.queryOneOrganisation(Organisation, organisationName);
    if (dbOrganisation) {
        console.log(`Updating Organisation = ${organisationName} Owner = ${owner} PAT = ${pat}.`);
        await dbHelper.update(Organisation, dbOrganisation.id, {
            name: organisationName,
            owner,
            personalAccessToken: pat
        });
    }
    else {
        console.log(`Adding Organisation = ${organisationName} Owner = ${owner} PAT = ${pat}.`);
        await dbHelper.create(Organisation, {
            id: helper.generateIdentifier(),
            name: organisationName,
            owner,
            personalAccessToken: pat
        });
    }
})();