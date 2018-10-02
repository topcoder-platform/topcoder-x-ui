Note this doc is informational only, it provides guides about how to build docker images. For validation refer to [VALIDATION.md](VALIDATION.md) for details.



## How To Build Docker Images

In each app, there is a `build.sh` file which uses a `Dockerfile` file to build that app.

The `build.sh` expects 2 arguments:

- BUILD_TYPE: The build type, like "local", "dev", "test", "prod". Required.

- ENV_FOLDER: The folder containing env files. Optional.

If ENV_FOLDER is not present, then system environment values will be used; otherwise the `<app-name>.env.default` and `<app-name>.env.<BUILD_TYPE>` files within given ENV_FOLDER will be used. 



For example, build topcoder-x-ui with system environment values:

```bash
./build.sh dev
# This will lookup the env values prefixed with "DEFAULT_" and "DEV_", then merge and inject them into docker image. The docker image built will have tag "topcoder-x-ui:dev"

./build.sh prod
# This will lookup the env values prefixed with "DEFAULT_" and "PROD_", then merge and inject them into docker image. The docker image built will have tag "topcoder-x-ui:prod"


# Assuming following system environment values:
#    DEFAULT_VERSION=1.0
#    DEFAULT_SECRET=111111
#    DEV_PORT=8080
#    DEV_SECRET=123456
#    PROD_PORT=80
#    PROD_SECRET=654321

# Then for dev deployment type the generated .env file will have following content:
#    VERSION=1.0
#    PORT=8080
#    SECRET=123456

# Then for prod deployment type the generated .env file will have following content:
#    VERSION=1.0
#    PORT=80
#    SECRET=654321
```



Another example, build topcoder-x-ui with env files:

```bash
./build.sh dev <path-to-env-files-folder>
# This will get the env values in topcoder-x-ui.env.default and topcoder-x-ui.env.dev in the given folder, then merge and inject them into docker image. The docker image built will have tag "topcoder-x-ui:dev"

./build.sh prod <path-to-env-files-folder>
# This will get the env values in topcoder-x-ui.env.default and topcoder-x-ui.env.prod in the given folder, then merge and inject them into docker image. The docker image built will have tag "topcoder-x-ui:prod"


# Assuming <path-to-env-files-folder>/topcoder-x-ui.env.default has following content:
#    VERSION=1.0
#    SECRET=111111
# Assuming <path-to-env-files-folder>/topcoder-x-ui.env.dev has following content:
#    PORT=8080
#    SECRET=123456
# Assuming <path-to-env-files-folder>/topcoder-x-ui.env.prod has following content:
#    PORT=80
#    SECRET=654321

# Then for dev deployment type the generated .env file will have following content:
#    VERSION=1.0
#    PORT=8080
#    SECRET=123456

# Then for prod deployment type the generated .env file will have following content:
#    VERSION=1.0
#    PORT=80
#    SECRET=654321
```



## Supported ENV

Following lists the env variables supported:

- topcoder-x-ui: refer to `topcoder-x-ui/cofiguration.md` for supported env variables.
- topcoder-x-receiver: refer to `topcoder-x-receiver/cofiguration.md` for supported env variables.
- topcoder-x-processor: refer to `topcoder-x-processor/cofiguration.md` for supported env variables.



## Validation

For a local validation, please refer to [VALIDATION.md](VALIDATION.md) for details.