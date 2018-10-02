#!/bin/bash
set -eo pipefail

# This script expects 1 argument:
#   $ENV: the env name, like "local", "dev", "test", "prod".

ENV=$1

if [ -z "$ENV" ]; then
  echo "Must provide the env name to build"
  exit 1
fi

SCRIPT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd -P);

# Build app
#   $1: The name of app to build
function build_app {
  cd "$SCRIPT_DIR/../$1"
  ./build.sh $ENV "$SCRIPT_DIR/env"
  cd "$SCRIPT_DIR"
}

build_app topcoder-x-ui
build_app topcoder-x-receiver
build_app topcoder-x-processor

# Following will create the certs for local validation
rm -rf certs
mkdir certs

cd certs

# Generate CA key and CA cert
openssl req -new -x509 -keyout kafka-ca.key -out kafka-ca.crt -days 9999 -subj '/CN=topcoder.com/OU=TEST/O=Topcoder/L=Indianapolis/ST=Indiana/C=US' -passin "pass:secret"  -passout "pass:secret"

# Create broker keystore
rm -f broker.keystore.jks
keytool -keystore broker.keystore.jks -alias kafka-broker -validity 9999 -genkey -keyalg RSA -noprompt -dname "CN=kafka.local, OU=TEST, O=Topcoder, L=Indianapolis, ST=Indiana, C=US" -storepass secret -keypass secret

# Create broker cert request
keytool -keystore broker.keystore.jks -alias kafka-broker -certreq -file broker.csr -storepass secret -keypass secret

# Sign broker cert with CA
openssl x509 -req -CA kafka-ca.crt -CAkey kafka-ca.key -in broker.csr -out broker-signed.crt -days 9999 -CAcreateserial -passin "pass:secret"

# Import CA to broker keystore
keytool -keystore broker.keystore.jks -alias CARoot -import -file kafka-ca.crt -noprompt -storepass secret -keypass secret

# Import broker signed cert to broker keystore
keytool -keystore broker.keystore.jks -alias kafka-broker -import -file broker-signed.crt -noprompt -storepass secret -keypass secret

# Create broker truststore and import CA
rm -f broker.truststore.jks
keytool -keystore broker.truststore.jks -alias CARoot -import -file kafka-ca.crt -noprompt -storepass secret -keypass secret

# Create Client key
openssl genrsa -des3 -out kafka_client.key -passout "pass:secret" 1024

# Create Client cert request
openssl req -new -key kafka_client.key -out kafka_client.req -subj '/CN=client.x.topcoder-dev.com/OU=TEST/O=Topcoder/L=Indianapolis/ST=Indiana/C=US' -passin "pass:secret" -passout "pass:secret"

# Sign client cert with CA
openssl x509 -req -CA kafka-ca.crt -CAkey kafka-ca.key -in kafka_client.req -out kafka_client.cer -days 9999 -CAcreateserial -passin "pass:secret"

cd ..

# Shut down docker compose
docker-compose -f docker-compose.local.yaml down
docker-compose -f docker-compose.test.yaml down

# Start up dependency services
docker-compose -f docker-compose.$ENV.yaml up -d maildev mongo zookeeper kafka

# Wait for kafka topic created
while true; do
  set +eo pipefail
  topicCreated=`docker exec -it kafka.local kafka-topics.sh --list --zookeeper zookeeper.local:2181 | grep tc-x-events`
  set -eo pipefail
  if [ -n "$topicCreated" ]; then
    break
  fi
  sleep 3
done

# Start up topcoder-x apps
docker-compose -f docker-compose.$ENV.yaml up -d topcoder-x-processor topcoder-x-ui topcoder-x-receiver
