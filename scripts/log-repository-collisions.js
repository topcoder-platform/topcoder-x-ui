const logger = require('../src/common/logger')
const models = require('../src/models')
const _ = require('lodash')

async function main() {
    const BATCH_SIZE = process.env.BATCH_SIZE || 15;
    let previousSize = BATCH_SIZE;
    let previousKey = null;
    // Array containing project ids already found colliding
    const collidingUrls = []
    let batch = 1;
    // Run this loop as long as there can be more objects in a database
    while (previousSize === BATCH_SIZE) {
        logger.debug(`Running batch no. ${batch}`)
        // Go over all active projects, limiting to BATCH_SIZE
        const projects = await models.Project.scan({
            archived: 'false'
        }).consistent().limit(BATCH_SIZE).startAt(previousKey).exec()
        for (const project of projects) {
            // If url was already found colliding go to a next iteration
            if (collidingUrls.includes(project.repoUrl)) continue;
            const collisions = await models.Project.scan({
                repoUrl: project.repoUrl,
                archived: 'false'
            }).exec()
            // If scan found only this project go to a next interation
            if (collisions.length < 2) continue;
            logger.info(`Repository ${project.repoUrl} has ${collisions.length} collisions`);
            _.forEach(collisions, collision => {
                logger.info(`--- ID: ${collision.id}`)
            })
            collidingUrls.push(project.repoUrl)
        }
        previousKey = projects.lastKey
        previousSize = projects.scannedCount
        batch++
    }
}
main().then(() => {
   logger.info('Collision scan completed')
}).catch(err => {
    logger.logFullError(err, 'collision scan')
})
