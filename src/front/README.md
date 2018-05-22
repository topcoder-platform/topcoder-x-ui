# Topcoder-x App

Topcoder-x UI

## Software Requirements

- node.js v6+
- npm v3+
- Google Chrome browser version >= 55.0.2883.0

## Configuration

The configuration is provided in `config.js` in the base directory.
It contains four environments (`local`, `dev`, `qa`, `prod`) which are controlled by the BUILD_ENV environment variable,
it defaults to the `dev` environment if BUILD_ENV is empty.

The following configuration parameters are available:

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


## Installation

Run `npm i` to install dependencies

## Run Application

Run `npm run start` to launch a browser sync server on your source files or `npm run serve:dist` to launch a server on your optimized application

Application will be hosted and running at http://topcoderx.topcoder-dev.com:3000.

## Build Application

Run `npm run build` to build an optimized version of your application in /dist

## Linting

Run `npm run lint` to lint the code, which will also fix the automatically fixable issues.

## Execute E2E Tests

Before executing the end-to-end (e2e) protractor tests, these environment variables should be set:

| Name | Description | Default Value |
| --- | --- | --- |
| BUILD_ENV | Deployment configuration to be tested by e2e tests. | See [Configuration](#configuration) for possible values. Defaults to `dev`. |
| TEST_PORT | Port from which to serve the app for e2e tests. | Defaults to `3000`. |

```npm run test```

## Publish

Configure following environment variables

- `AWS_BUCKET` the AWS bucket
- `AWS_KEY` the AWS key
- `AWS_SECRET` the AWS secret key

Run below commands sequentially

- `npm run build`
- `npm run publish`

## Heroku Deployment
Follow the below steps to deploy the app to heroku
1. `heroku login`
2. `heroku create`
3. `heroku config:set NPM_CONFIG_PRODUCTION=false` so that heroku will install dev dependencies
4. set buildpacks
```
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git
```
5. `git push heroku master` or `git push heroku develop:master` to deploy develop branch
6. `heroku open` to load the app on browser

NOTE: Once environment variable are changed in heroku please run 
`heroku run npm run build` 