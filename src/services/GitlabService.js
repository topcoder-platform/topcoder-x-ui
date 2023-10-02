const uuid = require('uuid').v4;
const Joi = require('joi');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const _ = require('lodash');
const {Gitlab} = require('@gitbeaker/rest');
const config = require('../config');
const constants = require('../common/constants');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const logger = require('../common/logger');
const User = require('../models').User;
const GitlabUserMapping = require('../models').GitlabUserMapping;
const OwnerUserGroup = require('../models').OwnerUserGroup;

const request = superagentPromise(superagent, Promise);

// milliseconds per second
const MS_PER_SECOND = 1000;

const LOCK_TTL_SECONDS = 20;

const MAX_RETRY_COUNT = 30;

const COOLDOWN_TIME = 1000;

/**
 * A schema for a Gitlab user, as stored in the TCX database.
 * @typedef {Object} User
 * @property {String} accessToken the access token
 * @property {Date} accessTokenExpiration the access token expiration date
 * @property {String} refreshToken the refresh token
 * @property {Number} userProviderId the user provider id
 * @property {String} topcoderUsername the topcoder username
 * @property {String} username the username
 * @property {String} type the type
 * @property {String} id the id
 * @property {String} role the role
 */

const USER_SCHEMA = Joi.object().keys({
  accessToken: Joi.string().required(),
  accessTokenExpiration: Joi.date().required(),
  refreshToken: Joi.string().required(),
  userProviderId: Joi.number().required(),
  topcoderUsername: Joi.string(),
  username: Joi.string().optional(),
  type: Joi.string().valid('gitlab').required(),
  id: Joi.string().optional(),
  role: Joi.string().valid('owner', 'guest').required(),
  lockId: Joi.string().optional(),
  lockExpiration: Joi.date().optional(),
}).required();


/**
 * @typedef {Object} ProjectWithId
 * @property {Number} id the project id
 */

class GitlabService {
  /** @type {User} */
  user = null;

  /** @type {import('@gitbeaker/rest').Gitlab} */
  #gitlab = null;

  constructor(user) {
    if (!user) {
      throw new Error('User is required.');
    }
    Joi.attempt(user, USER_SCHEMA);
    this.user = user;
  }

  /**
   * Get the full URL for a Gitlab repository from its full name.
   * @param {String} repoFullName Repo full name
   * @returns {String}
   */
  static getRepoUrl(repoFullName) {
    return `${config.GITLAB_API_BASE_URL}/${repoFullName}`;
  }

  /**
   * Helper method for initializing a GitlabService instance with a user model
   * instance.
   * @param {User} user the user
   * @returns {Promise<GitlabService>} the GitlabService instance
   */
  static async create(user) {
    const svc = new GitlabService(user);
    try {
      await svc.refreshAccessToken();
      svc.#gitlab = new Gitlab({
        host: config.GITLAB_API_BASE_URL,
        oauthToken: svc.user.accessToken,
      });
      return svc;
    } catch (err) {
      throw errors.handleGitLabError(err, 'Authentication failed for Gitlab user');
    }
  }

  /**
   * Helper method for initializing a Gitlab client instance directly with an
   * access token.
   * @param {string} accessToken The access token
   * @returns {Promise<import('@gitbeaker/rest').Gitlab>} the Gitlab client
   */
  static async getClientWithAccessToken(accessToken) {
    const gitlab = new Gitlab({
      host: config.GITLAB_API_BASE_URL,
      oauthToken: accessToken,
    });
    return gitlab;
  }

  /**
   * Refresh the user access token if needed
   */
  async refreshAccessToken() {
    const lockId = uuid().replace(/-/g, '');
    let lockedUser;
    let tries = 0;
    try {
      // eslint-disable-next-line no-constant-condition, no-restricted-syntax
      while ((tries < MAX_RETRY_COUNT) && !(lockedUser && lockedUser.lockId === lockId)) {
        logger.debug(`[Lock ID: ${lockId}][Attempt #${tries + 1}] Acquiring lock on user ${this.user.username}.`);
        lockedUser = await dbHelper.acquireLockOnUser(this.user.id, lockId, LOCK_TTL_SECONDS * MS_PER_SECOND);
        if (!lockedUser || !lockedUser.lockId || lockedUser.lockId !== lockId) {
          await new Promise((resolve) => setTimeout(resolve, COOLDOWN_TIME));
        }
        tries += 1;
      }
      if (!lockedUser) {
        throw new Error(`Failed to acquire lock on user ${this.user.id} after ${tries} attempts.`);
      }
      logger.debug(`[Lock ID: ${lockId}] Acquired lock on user ${this.user.username}.`);
      if (lockedUser.accessTokenExpiration && new Date().getTime() > lockedUser.accessTokenExpiration.getTime() -
        (config.GITLAB_REFRESH_TOKEN_BEFORE_EXPIRATION * MS_PER_SECOND)) {
        logger.debug(`[Lock ID: ${lockId}] Refreshing access token for user ${this.user.username}.`);
        const query = {
          client_id: config.GITLAB_CLIENT_ID,
          client_secret: config.GITLAB_CLIENT_SECRET,
          refresh_token: lockedUser.refreshToken,
          grant_type: 'refresh_token',
        };
        const refreshTokenResult = await request
          .post(`${config.GITLAB_API_BASE_URL}/oauth/token`)
          .query(query)
          .end();
        // save user token data
        const expiresIn = refreshTokenResult.body.expires_in || config.GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION;
        const updates = {
          accessToken: refreshTokenResult.body.access_token,
          accessTokenExpiration: new Date(new Date().getTime() + expiresIn * MS_PER_SECOND),
          refreshToken: refreshTokenResult.body.refresh_token,
        };
        _.assign(lockedUser, updates);
        await dbHelper.update(User, lockedUser.id, updates);
      }
    } catch (err) {
      throw await helper.convertGitLabErrorAsync(err, 'Failed to refresh access token.', this.user.username);
    } finally {
      if (lockedUser) {
        logger.debug(`[Lock ID: ${lockId}] Releasing lock on user ${this.user.username}.`);
        const newUser = await dbHelper.releaseLockOnUser(this.user.id, lockId);
        // Not assigning directly because the old object sometimes has properties
        // that are not in the new one
        _.assign(this.user, newUser);
      }
    }
  }

  /**
  * Get user profile.
  * @param {string} token User token
  * @returns {Promise<Object>} the promise result of user profile
  */
  static async getUserProfile(token) {
    Joi.attempt(token, Joi.string().required());
    try {
      // get current user name
      const userProfile = await request
        .get(`${config.GITLAB_API_BASE_URL}/api/v4/user`)
        .set('Authorization', `Bearer ${token}`)
        .end()
        .then((res) => res.body);
      if (!userProfile) {
        throw new errors.UnauthorizedError('Can not get user from the access token.');
      }
      return userProfile;
    } catch (err) {
      if (!(err instanceof errors.UnauthorizedError)) {
        throw helper.convertGitLabError(err, 'Failed to ensure valid owner user.');
      }
      throw err;
    }
  }

  /**
  * Ensure the owner user is in database.
  * @param {String} token the access token of owner user
  * @param {Date} accessTokenExpiration the access token expiration of owner user
  * @param {String} refreshToken the refresh token of owner user
  * @param {String} topcoderUsername the topcoder handle of owner user
  * @param {String} userRole the role of user
  * @returns {Promise} the promise result of found owner user
  */
  static async ensureUser(token, accessTokenExpiration, refreshToken, topcoderUsername, userRole) {
    Joi.attempt({token, accessTokenExpiration, refreshToken, topcoderUsername, userRole}, Joi.object().keys({
      token: Joi.string().required(),
      accessTokenExpiration: Joi.date().required(),
      refreshToken: Joi.string().required(),
      topcoderUsername: Joi.string().required(),
      userRole: Joi.string().required(),
    }));
    const userProfile = await GitlabService.getUserProfile(token);
    const user = await dbHelper.queryOneUserByTypeAndRole(User,
      userProfile.username,
      constants.USER_TYPES.GITLAB,
      userRole);

    const userMapping = await dbHelper.queryOneUserMappingByTCUsername(GitlabUserMapping, topcoderUsername);
    if (!userMapping) {
      await dbHelper.create(GitlabUserMapping, {
        id: helper.generateIdentifier(),
        topcoderUsername,
        gitlabUserId: userProfile.id,
        gitlabUsername: userProfile.username,
      });
    } else {
      await dbHelper.update(GitlabUserMapping, userMapping.id, {
        gitlabUserId: userProfile.id,
        gitlabUsername: userProfile.username,
      });
    }

    if (!user) {
      return await dbHelper.create(User, {
        id: helper.generateIdentifier(),
        role: userRole,
        type: constants.USER_TYPES.GITLAB,
        userProviderId: userProfile.id,
        username: userProfile.username,
        accessToken: token,
        accessTokenExpiration,
        refreshToken,
      });
    }
    // save user token data
    return await dbHelper.update(User, user.id, {
      userProviderId: userProfile.id,
      username: userProfile.username,
      accessToken: token,
      accessTokenExpiration,
      refreshToken,
    });
  }

  /**
   * List groups of owner user.
   * @param {Number} page the page number (default to be 1). Must be >= 1
   * @param {Number} perPage the page size (default to be constants.GITLAB_DEFAULT_PER_PAGE).
   *   Must be within range [1, constants.GITLAB_MAX_PER_PAGE]
   * @param {Boolean} getAll get all groups
   * @returns {Promise} the promise result
   */
  async listOwnerUserGroups(page = 1, perPage = constants.GITLAB_DEFAULT_PER_PAGE,
    getAll = false) {
    Joi.attempt({page, perPage, getAll}, Joi.object().keys({
      page: Joi.number().integer().min(1).optional(),
      perPage: Joi.number().integer().min(1).max(constants.GITLAB_MAX_PER_PAGE)
        .optional(),
      getAll: Joi.boolean().optional(),
    }));
    const token = this.user.accessToken;
    const gitUsername = this.user.username;
    try {
      const response = await request
        .get(`${config.GITLAB_API_BASE_URL}/api/v4/groups`)
        .query({page, per_page: perPage, owned: true, all_available: getAll})
        .set('Authorization', `Bearer ${token}`)
        .end();

      const result = {
        page,
        perPage,
        lastPage: 1,
        groups: response.body,
      };

      if (response.headers.link) {
        const links = response.headers.link.split(/\s*,\s*/);
        links.forEach((link) => {
          if (link.endsWith('rel="last"')) {
            const matches = link.match(/.*[?&]page=(\d+).*/);
            if (matches) {
              result.lastPage = parseInt(matches[1], 10);
            }
          }
        });
      }
      return result;
    } catch (err) {
      throw await helper.convertGitLabErrorAsync(err, 'Failed to list user groups', gitUsername);
    }
  }

  /**
   * Get owner user group registration URL.
   * @param {String} groupId the group id
   * @param {String} accessLevel the group access level
   * @param {String} expiredAt the expired at params to define how long user joined teams. can be null
   * @returns {Promise} the promise result
   */
  async getGroupRegistrationUrl(groupId, accessLevel, expiredAt) {
    Joi.attempt({groupId, accessLevel, expiredAt}, Joi.object().keys({
      groupId: Joi.string().required(),
      accessLevel: Joi.string().required(),
      expiredAt: Joi.string(),
    }));

    // generate identifier
    const identifier = helper.generateIdentifier();

    // create owner user group
    await dbHelper.create(OwnerUserGroup, {
      id: helper.generateIdentifier(),
      ownerUsername: this.user.username,
      type: constants.USER_TYPES.GITLAB,
      groupId,
      identifier,
      accessLevel,
      expiredAt,
    });

    // construct URL
    const url = `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/groups/registration/${identifier}`;
    return {url};
  }

  /**
   * Add group member.
   * @param {String} groupId the group id
   * @param {import('@gitbeaker/rest').ExpandedUserSchema} userInfo the user info
   * @param {String} accessLevel the access level
   * @param {String} expiresAt the expired at params to define how long user joined teams. can be null
   * @returns {Promise} the promise result
   */
  async addGroupMember(groupId, userInfo, accessLevel, expiresAt) { // eslint-disable-line max-params
    Joi.attempt({groupId, userInfo, accessLevel, expiresAt}, Joi.object().keys({
      groupId: Joi.string().required(),
      userInfo: Joi.object().keys({
        username: Joi.string().required(),
        id: Joi.number().required(),
      }).unknown(true).required(),
      accessLevel: Joi.string().required(),
      expiresAt: Joi.string(),
    }));
    const {username, id: userId} = userInfo;
    try {
      // get normal user id
      await this.#gitlab.GroupMembers.add(groupId, userId, accessLevel, { expiresAt });
      // return gitlab username
      return { username, id: userId };
    } catch (err) {
      if (_.get(err, 'cause.description') !== '"Member already exists"') {
        if (err instanceof errors.ApiError) {
          throw err;
        }
        throw await helper.convertGitLabErrorAsync(
          err, `Failed to add group member userId=${userId} accessLevel=${accessLevel} expiresAt=${expiresAt}`,
          username);
      }
      return {username, id: userId};
    }
  }

  /**
   * Gets the user id by username
   * @param {string} username the username
   * @returns {Promise<number>} the user id
   */
  static async getUserIdByUsername(username) {
    Joi.attempt(username, Joi.string().required());
    try {
      // get current user
      const users = await request
        .get(`${config.GITLAB_API_BASE_URL}/api/v4/users?username=${username}`)
        .end()
        .then((res) => res.body);
      if (!users || !users.length) {
        throw new errors.NotFoundError(`The user with username ${username} is not found on gitlab`);
      }
      return users[0].id;
    } catch (err) {
      throw helper.convertGitLabError(err, 'Failed to get detail about user from gitlab');
    }
  }

  /**
   * delete user from group
   * @param {String} gitUsername the git username
   * @param {String} ownerUserToken the gitlab owner token
   * @param {String} groupId the gitlab group Id
   * @param {String} userId the normal user id
   */
  async deleteUserFromGitlabGroup(groupId, userId) {
    Joi.attempt({groupId, userId}, Joi.object().keys({
      groupId: Joi.string().required(),
      userId: Joi.string().required(),
    }));
    try {
      await request
        .del(`${config.GITLAB_API_BASE_URL}/api/v4/groups/${groupId}/members/${userId}`)
        .set('Authorization', `Bearer ${this.user.accessToken}`)
        .send()
        .end();
    } catch (err) {
      // If a user is not found from gitlab, then ignore the error
      // eslint-disable-next-line no-magic-numbers
      if (err.status !== 404) {
        throw await helper.convertGitLabErrorAsync(
          err, `Failed to delete user from group, userId is ${userId}, groupId is ${groupId}.`, this.user.username);
      }
    }
  }
}

module.exports = GitlabService;

helper.buildService(module.exports, true);
