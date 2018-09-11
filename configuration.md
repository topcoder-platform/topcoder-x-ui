# Topcoder X Configuration

The following config parameters are supported, they are defined in `src/config.js` and can be configured as env variables:


| Name                                   | Description                                | Default                          |
| :------------------------------------- | :----------------------------------------: | :------------------------------: |
| PORT                                   | the port the application will listen on    | 80                              |
| API_VERSION                            | the API version                            | v1                             |
| LOG_LEVEL                              | the log level                              | info                            |
| SESSION_SECRET                         | the session secret                         | kjsdfkj34857                     |
| GITHUB_CLIENT_ID                       | the GitHub client id                       | No default - needs to be set up using the instructions below                                 |
| GITHUB_CLIENT_SECRET                   | the GitHub client secret                   | No default - needs to be set up using the instructions below                                                         |
| GITLAB_CLIENT_ID                       | the GitLab client id                       | No default - needs to be set up using the instructions below                                                           |
| GITLAB_CLIENT_SECRET                   | the GitLab client secret                   | No default - needs to be set up using the instructions below                                                             |
| WEBSITE                                | used as base to construct various URLs     | http://topcoderx.topcoder-dev.com/ |
| GITLAB_API_BASE_URL                    | The Gitlab API base URL                    | https://gitlab.com|
| MONGODB_URI                            | The MongoDB URI.  This needs to be the same MongoDB used by topcoder-x-receiver, topcoder-x-processor, and topcoder-x-site                           | mongodb://127.0.0.1:27017/topcoderx |
|TOPIC  | The Kafka topic where events are published.  This must be the same as the configured value for topcoder-x-processor| |
|KAFKA_OPTIONS | Kafka connection options| |
|KAFKA_HOST | The Kafka host to connect to| localhost:9092 |
|KAFKA_CLIENT_CERT | The Kafka SSL certificate to use when connecting| Read from kafka_client.cer file, but this can be set as a string like it is on Heroku |
|KAFKA_CLIENT_CERT_KEY | The Kafka SSL certificate key to use when connecting| Read from kafka_client.key file, but this can be set as a string like it is on Heroku|
| HOOK_BASE_URL            | The base URL of the topcoder-x-receiver, used when adding webhooks automatically to repositories | |
| TOPCODER_ENV | The topcoder environment to use, can support 'dev' or 'prod' | 'dev'                     |
|LABELS| Labels we are going to add to the repository in the form of array of object with `name` and `color` property. Color should be hex code without hash||
|ALLOWED_TOPCODER_ROLES| The allowed Topcoder role to use Topcoder X app| see configuration |
|COPILOT_ROLE| The role to identify copilot|'copilot'|
|HELP_LINK| The link for help| 'https://github.com/topcoder-platform/topcoder-x-ui/wiki'|

## GitHub OAuth App Setup

These instructions should be used to generate the GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET values for configuration

- Login into github.com
- Click the upper right avatar, then click `Settings`
- Click the left panel --> Developer settings --> OAuth Apps
- Click the `Register a new application`, fill in the fields,
  note that the `Authorization callback URL` should be the deployed topcoder-x web site,
  for local deployment, it should be `http://topcoderx.topcoder-dev.com`
- After creating the OAuth app, you can see its client id and client secret,
  these should be set to GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables

## GitLab OAuth App Setup

These instructions should be used to generate the GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET values for configuration


- Login into gitlab.com
- Click the upper right avatar, then click `Settings`
- Click the `Applications` tab
- Enter an application name, e.g. `Topcoder-X`
- For Redirect URI, enter two callback URLs, one callback URL per line, so there are two lines:
  http://topcoderx.topcoder-dev.com/api/v1/gitlab/owneruser/callback
  http://topcoderx.topcoder-dev.com/api/v1/gitlab/normaluser/callback
- For Scopes, check the `api` and `read_user`, the `api` is for owner user, the `read_user` is for normal user
- Finally, click `Save application` to save the OAuth app, then you will see its generated Application Id and Secret,
  these should be set to GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET environment variables

  ## Topcoder environment

  Application depends upon the environment of Topcoder based on TOPCODER_ENV configuration. When this value is 'dev' you should be using topcoderx.topcoder-dev.com.

  To switch to production, simply change the TOPCODER_DEV to 'prod' and use topcoderx.topcoder.com

  Default configuration is for topcoder-dev environment.
