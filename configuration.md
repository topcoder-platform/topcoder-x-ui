# Topcoder x configuration

Map the localhost to topcoderx.topcoder-dev.com or topcoderx.topcoder.com depending upon target topcoder environment by editing `hosts` file.

The following config parameters are supported, they are defined in `src/config.js` and can be configured in system environment:


| Name                                   | Description                                | Default                          |
| :------------------------------------- | :----------------------------------------: | :------------------------------: |
| PORT                                   | the port the application will listen on    |  80                              |
| API_VERSION                            | the API version                            |   v1                             |
| LOG_LEVEL                              | the log level                              |  info                            |
| MONGODB_URI                            | the MongoDB URI                            | mongodb://localhost:27017/topcoderx |
| SESSION_SECRET                         | the session secret                         | kjsdfkj34857                     |
| GITHUB_CLIENT_ID                       | the GitHub client id                       |                                  |
| GITHUB_CLIENT_SECRET                   | the GitHub client secret                   |                                  |
| GITLAB_CLIENT_ID                       | the GitLab client id                       |                                  |
| GITLAB_CLIENT_SECRET                   | the GitLab client secret                   |                                  |
| WEBSITE                                | used as base to construct various URLs     | http://topcoderx.topcoder-dev.com/ |
| GITLAB_API_BASE_URL                    | The Gitlab API base URL                    | https://gitlab.com|
|TOPIC  | kafka topic| |
|KAFKA_OPTIONS | kafka options| |
| HOOK_BASE_URL            | The generated ngrok url of receiver service|
| TOPCODER_ENV                           | The topcoder environment to use, can support 'dev' or 'prod' | 'dev'                     |
|LABELS| Labels we are going to add to the repository in the form of array of object with `name` and `colo` property. color should be hex code without hash||

## GitHub OAuth App Setup

- login into github.com
- click the upper right avatar, then click `Settings`
- click the left panel --> Developer settings --> OAuth Apps
- click the `Register a new application`, fill in the fields,
  note that the `Authorization callback URL` should be the deployed web site,
  for local deployment, it should be `http://topcoderx.topcoder-dev.com`
- after creating the OAuth app, you can see its client id and client secret,
  these should be set to GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables

## GitLab OAuth App Setup

- login into gitlab.com
- click the upper right avatar, then click `Settings`
- click the `Applications` tab
- enter application name, e.g. `Topcoder-x`
- for Redirect URI, enter two callback URLs, one callback URL per line, so there are two lines:
  http://topcoderx.topcoder-dev.com/api/v1/gitlab/owneruser/callback
  http://topcoderx.topcoder-dev.com/api/v1/gitlab/normaluser/callback
- for Scopes, check the `api` and `read_user`, the `api` is for owner user, the `read_user` is for normal user
- finally click `Save application` to save the OAuth app, then you will see its generated Application Id and Secret,
  these should be set to GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET environment variables

  ## Topcoder environment
  When application depends upon the environment of Topcoder based on TOPCODER_ENV configuration. When this value is 'dev'
  you should be using topcoderx.topcoder-dev.com.

  To switch to production, simply change the TOPCODER_DEV to 'prod' and use topcoderx.topcoder.com


  Default configuration is for topcoder-dev environment.

  ## Credentials
  - for topcoder login in dev environment you can use any valid topcoder handle with default password 'appirio123'
  - for gitlab/github, you can use your own user account