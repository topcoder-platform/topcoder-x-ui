#!/bin/bash
set -eo pipefail

# This script expects 2 arguments:
#   $BUILD_TYPE: The build type, like "local", "dev", "test", "prod". Required.
#   $ENV_FOLDER: The folder containing env files. Optional.
#
# If $ENV_FOLDER is not present, then environment values will be used;
# otherwise the topcoder-x-ui.env.default and topcoder-x-ui.env.$BUILD_TYPE
# files within $ENV_FOLDER will be used.

BUILD_TYPE=$1
ENV_FOLDER="$2"
APP="topcoder-x-ui"

if [ -z "$BUILD_TYPE" ]; then
  echo "Must provide the build type to build"
  exit 1
fi

ENV_FILE=".env.$BUILD_TYPE.tmp"
DEFAULT_FILE=".env.default.tmp"
rm -f "$ENV_FILE"
rm -f "$DEFAULT_FILE"

if [ -z "$ENV_FOLDER" ]; then
  # Use environment values
  touch "$ENV_FILE"
  touch "$DEFAULT_FILE"

  # Loop the environment values, find the ones start with DEFAULT_ and $BUILD_TYPE_
  # Assuming given $BUILD_TYPE is "prod" and environment has following values:
  #   DEFAULT_VERSION=1.0
  #   DEFAULT_SECRET=111111
  #   PROD_PORT=80
  #   PROD_SECRET=654321
  #   LOCAL_PORT=8080
  #   LOCAL_SECRET=123456
  # Then the generated .env file will have following content:
  #   VERSION=1.0
  #   PORT=80
  #   SECRET=654321
  BUILD_TYPE_UPPER=`echo $BUILD_TYPE | awk '{print toupper($0)}'`
  for var in $(compgen -e); do
    if [[ "$var" =~ ^DEFAULT\_.* ]]; then
      tripVar=${var#DEFAULT_}
      echo $tripVar=${!var} >> "$DEFAULT_FILE"
    fi
    if [[ "$var" =~ ^$BUILD_TYPE_UPPER\_.* ]]; then
      tripVar=${var#"$BUILD_TYPE_UPPER"_}
      echo $tripVar=${!var} >> "$ENV_FILE"
    fi
  done

else
  if [ ! -d "$ENV_FOLDER" ]; then
    echo "$ENV_FOLDER does not exist"
    exit 1
  fi

  P_DEFAULT_FILE="$ENV_FOLDER/$APP.env.default"
  P_ENV_FILE="$ENV_FOLDER/$APP.env.$BUILD_TYPE"

  if [ ! -f "$P_DEFAULT_FILE" ]; then
    echo "$P_DEFAULT_FILE does not exist"
    exit 1
  fi
  cp -f "$P_DEFAULT_FILE" "$DEFAULT_FILE"

  if [ ! -f "$P_ENV_FILE" ]; then
      echo "Will only use default env since $P_ENV_FILE does not exist"
      touch "$ENV_FILE"
  else
      cp -f "$P_ENV_FILE" "$ENV_FILE"
  fi
fi

awk -F= '!a[$1]++' "$ENV_FILE" "$DEFAULT_FILE" > .env

rm -f "$ENV_FILE"
rm -f "$DEFAULT_FILE"

# Build docker image
docker build -t $APP:$BUILD_TYPE -f Dockerfile .