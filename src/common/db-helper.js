// eslint-disable-line max-lines
const _ = require('lodash');
const logger = require('./logger');
const models = require('../models');

/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
/**
 * This module contains the database helper methods.
 *
 * @version 1.0
 */

/**
 * Get Data by model id
 * @param {Object} model The dynamoose model to query
 * @param {String} id The id value
 * @returns {Promise<void>}
 */
async function getById(model, id) {
  return await new Promise((resolve, reject) => {
    model.queryOne('id').eq(id).consistent().all().exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB getById error ${err}`);
        reject(err);
      }

      return resolve(result);
    });
  });
}

/**
 * Get Data by model id
 * @param {Object} model The dynamoose model to query
 * @param {String} key The key name
 * @param {String} value The value
 * @returns {Promise<void>}
 */
async function getByKey(model, key, value) {
  return await new Promise((resolve, reject) => {
    model.queryOne(key).eq(value).all().exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB getById error ${err}`);
        reject(err);
      }

      return resolve(result);
    });
  });
}

/**
 * Get data collection by scan parameters
 * @param {Object} model The dynamoose model to scan
 * @param {Object} scanParams The scan parameters object
 * @returns {Promise<void>}
 */
async function scan(model, scanParams) {
  return await new Promise((resolve, reject) => {
    model.scan(scanParams).exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        return reject(err);
      }

      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get data collection by scan parameters with paging
 * @param {Object} model The dynamoose model to scan
 * @param {Object} scanParams The scan parameters object
 * @param {String} size The size of result
 * @param {String} lastKey The lastKey param
 * @returns {Promise<void>}
 */
async function scanWithLimit(model, scanParams, size, lastKey) {
  return await new Promise((resolve, reject) => {
    const scanMethod = model.scan(scanParams).limit(size);
    if (lastKey) scanMethod.startAt(lastKey);
    scanMethod.exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get data collection by scan parameters with paging
 * @param {Object} model The dynamoose model to scan
 * @param {String} size The size of result
 * @param {String} lastKey The lastKey param
 * @returns {Promise<void>}
 */
async function scanAll(model, size, lastKey) {
  return await new Promise((resolve, reject) => {
    const scanMethod = model.scan({}).limit(size);
    if (lastKey) scanMethod.startAt(lastKey);
    scanMethod.exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get data collection by scan parameters
 * @param {Object} model The dynamoose model to scan
 * @param {Object} scanParams The scan parameters object
 * @returns {Promise<void>}
 */
async function scanAllWithParams(model, scanParams) {
  return await new Promise((resolve, reject) => {
    model.scan(scanParams).all().exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        return reject(err);
      }

      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get data collection by scan with search
 * @param {Object} model The dynamoose model to scan
 * @param {String} containsKey The contains key param
 * @param {String} contains The contains value
 * @returns {Promise<void>}
 */
async function scanAllWithSearch(model, containsKey, contains) {
  return await new Promise((resolve, reject) => {
    const scanMethod = model.scan(containsKey).contains(contains).all();
    scanMethod.exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} repositoryId The repository id to query
 * @param {Number} number The number id to query
 * @param {String} provider The provider id to query
 * @returns {Promise<void>}
 */
async function queryOneIssue(model, repositoryId, number, provider) {

  return await new Promise((resolve, reject) => {

    model.query('repositoryId').eq(repositoryId)
    .where('number').eq(number)
    .filter('provider').eq(provider)
    .all()
    .exec((err, result) => {
      if (err) {
        logger.debug(`queryOne. Error. ${err}`);
        return reject(err);
      }

      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} username The user username
 * @param {String} type The type of user
 * @returns {Promise<void>}
 */
async function queryOneUserByType(model, username, type) {
  return await new Promise((resolve, reject) => {
    model.query('username').eq(username)
    .where('type')
    .eq(type)
    .all()
    .exec((err, result) => {
      if (err || !result) {
        logger.debug(`queryOneUserByType. Error. ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} username The user username
 * @param {String} type The type of user
 * @param {String} role The role of user
 * @returns {Promise<void>}
 */
async function queryOneUserByTypeAndRole(model, username, type, role) {
  return await new Promise((resolve, reject) => {
    model.query('username').eq(username)
    .where('type')
    .eq(type)
    .filter('role')
    .eq(role)
    .all()
    .exec((err, result) => {
      if (err || !result) {
        logger.debug(`queryOneUserByTypeAndRole. Error. ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} tcusername The tc username
 * @returns {Promise<void>}
 */
async function queryOneUserMappingByTCUsername(model, tcusername) {
  return await new Promise((resolve, reject) => {
    model.queryOne('topcoderUsername').eq(tcusername)
    .all()
    .exec((err, result) => {
      if (err) {
        logger.debug(`queryOneUserMappingByTCUsername. Error. ${err}`);
        return reject(err);
      }
      return resolve(result);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} repoUrl The repository url
 * @returns {Promise<void>}
 */
async function queryOneActiveProject(model, repoUrl) {
  return await new Promise((resolve, reject) => {
    queryOneActiveRepository(models.Repository, repoUrl).then((repo) => {
      if (!repo) resolve(null);
      else model.queryOne('id').eq(repo.projectId).consistent()
        .exec((err, result) => {
          if (err) {
            logger.debug(`queryOneActiveProject. Error. ${err}`);
            return reject(err);
          }
          return resolve(result);
        });
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} project The project
 * @param {String} username The username
 * @returns {Promise<void>}
 */
async function queryOneActiveCopilotPayment(model, project, username) {
  return await new Promise((resolve, reject) => {
    model.query('project').eq(project)
    .where('username')
    .eq(username)
    .filter('closed')
    .eq('false')
    .all()
    .exec((err, result) => {
      if (err || !result) {
        logger.debug(`queryOneActiveCopilotPayment. Error. ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} groupId The gitlab group id
 * @param {String} gitlabUserId The gitlab user id
 * @returns {Promise<void>}
 */
async function queryOneUserGroupMapping(model, groupId, gitlabUserId) {
  return await new Promise((resolve, reject) => {
    model.query('groupId').eq(groupId)
    .where('gitlabUserId')
    .eq(gitlabUserId.toString())
    .all()
    .exec((err, result) => {
      if (err || !result) {
        logger.debug(`queryOneUserGroupMapping. Error. ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} teamId The github team id
 * @param {String} githubUserName The github username
 * @param {String} githubOrgId The github org id
 * @returns {Promise<void>}
 */
async function queryOneUserTeamMapping(model, teamId, githubUserName, githubOrgId) {
  return await new Promise((resolve, reject) => {
    model.query('teamId').eq(teamId)
    .where('githubUserName')
    .eq(githubUserName)
    .filter('githubOrgId')
    .eq(githubOrgId)
    .all()
    .exec((err, result) => {
      if (err || !result) {
        logger.debug(`queryOneUserTeamMapping. Error. ${err}`);
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} repoUrl The repository url
 * @param {String} projectIdToFilter The projectId To Filter
 * @returns {Promise<void>}
 */
async function queryOneActiveProjectWithFilter(model, repoUrl, projectIdToFilter) {
  return await new Promise((resolve, reject) => {
    queryActiveRepositoriesExcludeByProjectId(models.Repository, repoUrl, projectIdToFilter).then((repos) => {
      if (!repos || repos.length === 0) resolve(null);
      else model.queryOne('id').eq(repos[0].projectId).consistent()
        .exec((err, result) => {
          if (err) {
            logger.debug(`queryOneActiveProjectWithFilter. Error. ${err}`);
            return reject(err);
          }
          return resolve(result);
        });
    });
  });
}

/**
 * Create item in database
 * @param {Object} Model The dynamoose model to query
 * @param {Object} data The create data object
 * @returns {Promise<void>}
 */
async function create(Model, data) {
  return await new Promise((resolve, reject) => {
    const dbItem = new Model(data);
    dbItem.save((err) => {
      if (err) {
        logger.error(`DynamoDB create error ${err}`);
        return reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Update item in database
 * @param {Object} Model The dynamoose model to update
 * @param {String} id The id of item
 * @param {Object} data The updated data object
 * @returns {Promise<void>}
 */
async function update(Model, id, data) {
  const dbItem = await getById(Model, id);
  Object.keys(data).forEach((key) => {
    dbItem[key] = data[key];
  });
  return await new Promise((resolve, reject) => {
    dbItem.save((err) => {
      if (err) {
        logger.error(`DynamoDB update error ${err}`);
        reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Delete item in database
 * @param {Object} Model The dynamoose model to delete
 * @param {String} id The id
 */
async function removeById(Model, id) {
  const dbItem = await getById(Model, id);
  await new Promise((resolve, reject) => {
    dbItem.delete((err) => {
      if (err) {
        logger.error(`DynamoDB remove error ${err}`);
        reject(err);
      }

      resolve(dbItem);
    });
  });
}

/**
 * Delete item in database
 * @param {Object} Model The dynamoose model to delete
 * @param {String} username The username
 * @param {String} type The type
 */
async function removeUser(Model, username, type) {
  const dbItem = await queryOneUserByType(Model, username, type);
  await new Promise((resolve, reject) => {
    dbItem.delete((err) => {
      if (err) {
        logger.error(`DynamoDB remove error ${err}`);
        reject(err);
      }

      resolve(dbItem);
    });
  });
}

/**
 * Get single data by query parameters
 * @param {Object} model The dynamoose model to query
 * @param {String} organisation The organisation name
 * @returns {Promise<void>}
 */
async function queryOneOrganisation(model, organisation) {
  return await new Promise((resolve, reject) => {
    model.queryOne('name').eq(organisation)
    .all()
    .exec((err, result) => {
      if (err) {
        logger.debug(`queryOneOrganisation. Error. ${err}`);
        return reject(err);
      }
      return resolve(result);
    });
  });
}

/**
 * Query one active repository
 * @param {String} url the repository url
 * @returns {Promise<Object>}
 */
async function queryOneRepository(url) {
  return await new Promise((resolve, reject) => {
    models.Repository.query({
      url,
    })
    .all()
    .exec((err, repos) => {
      if (err) {
        return reject(err);
      }
      if (!repos || repos.length === 0) resolve(null);
      if (repos.length > 1) {
        let error = `Repository's url is unique in this version.
          This Error must be caused by old data in the Repository table.
          The old version can only guarrentee that the active Repository's url is unique.
          Please migrate the old Repository table.`;
        logger.debug(`queryOneRepository. Error. ${error}`);
        reject(error);
      }
      return resolve(repos[0]);
    });
  });
}

/**
 * Query one active repository
 * @param {Object} model the dynamoose model
 * @param {String} url the repository url
 * @returns {Promise<Object>}
 */
async function queryOneActiveRepository(model, url) {
  return await new Promise((resolve, reject) => {
    model.queryOne({
      url,
      archived: 'false'
    })
    .all()
    .exec((err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

/**
 * Query active repository with project id exclude filter.
 * @param {String} url the repository url
 * @param {String} projectId the project id
 * @returns {Promise<Object>}
 */
async function queryActiveRepositoriesExcludeByProjectId(url, projectId) {
  return await new Promise((resolve, reject) => {
    models.Repository.query({
      url,
      archived: 'false'
    })
    .filter('projectId')
    .not().eq(projectId)
    .all()
    .exec((err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

/**
 * Query repository by project id.
 * @param {String} projectId the project id
 * @returns {Promise<Object>}
 */
async function queryRepositoriesByProjectId(projectId) {
  return await new Promise((resolve, reject) => {
    models.Repository.query({
      projectId
    })
    .all()
    .exec((err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

/**
 * Query repository by project id with url filter.
 * @param {String} projectId the project id
 * @param {String} url the repo url
 * @returns {Promise<Object>}
 */
async function queryRepositoryByProjectIdFilterUrl(projectId, url) {
  return await new Promise((resolve, reject) => {
    models.Repository.query({
      projectId
    })
    .filter('url')
    .eq(url)
    .all()
    .exec((err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Find array of repo url of given project id
 * @param {String} projectId the project id
 * @returns {Promise<Object>}
 */
async function populateRepoUrls(projectId) {
  return await new Promise((resolve, reject) => {
    models.Repository.query({
      projectId
    })
    .all()
    .exec((err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(_.map(result, 'url'));
    });
  });
}

module.exports = {
  getById,
  getByKey,
  scan,
  scanAll,
  scanAllWithSearch,
  scanWithLimit,
  scanAllWithParams,
  create,
  update,
  removeById,
  removeUser,
  populateRepoUrls,
  queryActiveRepositoriesExcludeByProjectId,
  queryOneActiveCopilotPayment,
  queryOneActiveProject,
  queryOneActiveProjectWithFilter,
  queryOneActiveRepository,
  queryOneRepository,
  queryOneOrganisation,
  queryOneIssue,
  queryOneUserByType,
  queryOneUserByTypeAndRole,
  queryOneUserGroupMapping,
  queryOneUserTeamMapping,
  queryOneUserMappingByTCUsername,
  queryRepositoriesByProjectId,
  queryRepositoryByProjectIdFilterUrl
};
