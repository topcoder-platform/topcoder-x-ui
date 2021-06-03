# Topcoder X app

## Requirements

- Nodejs 8 is required
- DynamoDB
- kafka
- nodemon (for local development)

## Install dependencies

```shell
npm install
```

## Source code lint

eslint is used to lint the javascript source code:

```shell
npm run lint
```

## Endpoints

- GET /github/owneruser/login - github owner user login, using GitHub OAuth
- GET /github/owneruser/callback - github owner user login OAuth callback
- GET /github/owneruser/teams - github owner user views his/her teams
- GET /github/teams/:id/registrationurl - github owner user creates a registration URL for his/her team
- GET /github/teams/registration/:identifier - normal user registers a team via this API, it will do GitHub OAuth
- GET /github/normaluser/callback - normal user GitHub OAuth callback

- GET /gitlab/owneruser/login - gitlab owner user login, using GitLab OAuth
- GET /gitlab/owneruser/callback - gitlab owner user login OAuth callback
- GET /gitlab/owneruser/groups - gitlab owner user views his/her groups
- GET /gitlab/groups/:id/registrationurl - gitlab owner user creates a registration URL for his/her group
- GET /gitlab/groups/registration/:identifier - normal user registers a group via this API, it will do GitLab OAuth
- GET /gitlab/normaluser/callback - normal user GitLab OAuth callback

- GET /tclogin - TopCoder login
- GET /admin/tcuser - get TopCoder/GitLab/GitHub user mapping

- GET /projects - gets the projects
- POST /projects - creates a project
- put /projects - updates the project
- post /projects/label - create labels in project
- post /projects/hook - create webhooks in the project repository
- GET /users/settings - gets the current user's setup
- GET /users/accessToken - gets the user's access token

- POST /issues - create an issue to Gitlab/Github
- POST /issues/recreate - recreate an issue DB and its challenge

- GET /health - gets the app health

## Configuration

please see [configuration.md](configuration.md).

## Local Deployment

```shell
npm run serve
```

Server should be started at port 80. 

## Heroku Deployment
Follow the below steps to deploy the app to heroku
1. `heroku login`
2. `heroku create`
3. `heroku config:set NPM_CONFIG_PRODUCTION=false` so that heroku will install dev dependencies
4. `git push heroku master` or `git push heroku develop:master` to deploy develop branch
5. `heroku open` to load the app on browser

Note: heroku domain should match subdomain of topcoder-dev or topcoder depending upon target topcoder environment

## Verification

- run `npm run serve` to start the app
- go to topcoderx.topcoder-dev.com and it will redirect to Topcoder login page, after successful login it will redirect back to Topcoder x app.
- go to settings by clicking username at top right corner
- setup both git provider to authorize topcoder-x to manage your repo on behalf of you
- go to project management and create/edit projects, create hook and label
- go to git access control menu and check list of groups have authorized
- click get link button to get the shareable link which can be used by topcoder member to self assign to the repository. Click to icon next to url to copy to clipboard.
- normal member cannot use the application, allowed roles are configured in API, if normal user tries to access the app, error is shown in login page.

## Topcoder Direct ID to Connect ID migration

Direct ID migration can be done with script located in **topcoder-x-processor** codebase called direct-connect-migration
```shell
npm run direct-connect-migration
```
By default it takes 15 projects at time, but you can change this by specifying BATCH_SIZE environment variable.

## Repository url collisions scan

To scan and log which projects has colliding (the same) repository urls run
```shell
npm run log-repository-collisions
```
By default it takes 15 projects at time, but you can change this by specifying BATCH_SIZE environment variable.