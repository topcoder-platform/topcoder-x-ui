# lagertha

## Requirements

- Nodejs 8 is required
- MongoDB 3.2
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
  
## Configuration

Map the localhost to topcoderx.topcoder.com by editing `hosts` file.

The following config parameters are supported, they are defined in `config.js` and can be configured in system environment:


| Name                                   | Description                                | Default                          |
| :------------------------------------- | :----------------------------------------: | :------------------------------: |
| PORT                                   | the port the application will listen on    |  80                              |
| API_VERSION                            | the API version                            |   v1                             |
| LOG_LEVEL                              | the log level                              |  info                            |
| MONGODB_URI                            | the MongoDB URI                            | mongodb://localhost:27017/topcoderx |
| PASSWORD_HASH_SALT_LENGTH              | the password hash salt length              | 10                               |
| SESSION_SECRET                         | the session secret                         | kjsdfkj34857                     |
| GITHUB_CLIENT_ID                       | the GitHub client id                       |                                  |
| GITHUB_CLIENT_SECRET                   | the GitHub client secret                   |                                  |
| GITLAB_CLIENT_ID                       | the GitLab client id                       |                                  |
| GITLAB_CLIENT_SECRET                   | the GitLab client secret                   |                                  |
| WEBSITE                                | used as base to construct various URLs     | http://topcoderx.topcoder.com/ |

| GITLAB_API_BASE_URL                    | The Gitlab API base URL                    | https://gitlab.com/api/v4        |

| TC_LOGIN_URL                           | URL to do TopCoder login |                      |
| TC_USER_PROFILE_URL                    | URL to to call TopCoder API to get profile from token    | https://accounts.topcoder.com/member?retUrl=http:%2F%2Ftopcoderx.topcoder.com%2Fapi%2Fv1%2Ftclogin |
|TOPIC | kafka topic| |
|KAFKA_OPTIONS | kafka options| |

Other are just constants which don't need to be changed unless modified in code level.

## FE Configs

The frontend config file contains following variables to be configured in `src/front/config.js`

| Name                     | Description                     |
|--------------------------|---------------------------------|
| ADMIN_TOOL_URL           | URL of the admin tool API       |
| COOKIES_SECURE           | If true the cookies set by this App will only be transmitted over secure  protocols like https. |
| AUTH_URL                 | Url of Topcoder auth form       |
| ACCOUNTS_CONNECTOR_URL   | Url to TC account connector     |
| JWT_V3_NAME              | jwt V3 cookie name              |
| JWT_V2_NAME              | jwt V2 cookie name              |
| DIRECT_URL_BASE          | URL to be used for constructing the direct url|
| LABELS                   | Labels we are going to add to the repository|
| LABELS_COLOR             | The colors for each label above |
| HOOK_BASE_URL            | The generated ngrok url of receiver service|

## GitHub OAuth App Setup

- login into github.com
- click the upper right avatar, then click `Settings`
- click the left panel --> Developer settings --> OAuth Apps
- click the `Register a new application`, fill in the fields,
  note that the `Authorization callback URL` should be the deployed web site,
  for local deployment, it should be `http://topcoderx.topcoder.com`
- after creating the OAuth app, you can see its client id and client secret,
  these should be set to GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables

## GitLab OAuth App Setup

- login into gitlab.com
- click the upper right avatar, then click `Settings`
- click the `Applications` tab
- enter application name, e.g. `Topcoder-x`
- for Redirect URI, enter two callback URLs, one callback URL per line, so there are two lines:
  http://topcoderx.topcoder.com/api/v1/gitlab/owneruser/callback
  http://topcoderx.topcoder.com/api/v1/gitlab/normaluser/callback
- for Scopes, check the `api` and `read_user`, the `api` is for owner user, the `read_user` is for normal user
- finally click `Save application` to save the OAuth app, then you will see its generated Application Id and Secret,
  these should be set to GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET environment variables

## Local Setup

```shell
npm run serve
```

Server should be started at port 80.

## Postman

Import docs/Ragnar.postman_collection.json and docs/Ragnar.postman_environment.json to Postman.

After admin login, the admin token is automatically set to ADMIN-TOKEN environment variable,
then you may run the `Save GitHub User` and `Save GitLab User` tests to create owner user of your GitHub/GitLab usernames,
note that you must modify the request body username to use your GitHub/GitLab user names.
For the `Get User Mapping` test, you may quety mapping by providing either topcoderUsername, githubUsername or gitlabUsername.

## Verification

- run `npm serve` to start the app
- go to topcoderx.topcoder.com and it will redirect to Topcoder login page, after successful login it will redirect back to Topcoder x app.
- go to settings by clicking username at top right corner
- setup both git provider to authorize topcoder-x to manage your repo on behalf of you
- go to project management and create/edit projects, create hook and label
- go to git access control menu and check list of groups have authorized
- click get link button to get the shareable link which can be used by topcoder member to self assign to the repository.

## Heroku Deployment
Follow the below steps to deploy the app to heroku
1. `heroku login`
2. `heroku create`
3. `heroku config:set NPM_CONFIG_PRODUCTION=false` so that heroku will install dev dependencies
5. `git push heroku master` or `git push heroku develop:master` to deploy develop branch
6. `heroku open` to load the app on browser

NOTE: Once environment variable are changed in heroku please run 
`heroku run npm run build` 
