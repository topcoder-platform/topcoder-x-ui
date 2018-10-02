## Prerequisite

Git

Docker & Docker-compose

JDK 1.8 & OpenSSL: used to generate certificates. The OpenSSL most likely already exists in Linux/Mac system, if you don't have it get it here https://wiki.openssl.org/index.php/Binaries



## Clone Repo

Within submission root dir, clone git repos, e.g clone the master branch to deploy:

```bash
# Within submission root dir

# The submission works on commit 96988f9ce80d968fe6be0a0fd31632b73442cbc0
git clone -b master https://github.com/topcoder-platform/topcoder-x-ui
cd topcoder-x-ui && git checkout 96988f9ce80d968fe6be0a0fd31632b73442cbc0 && cd ..

# The submission works on commit 3c5d798d133adc5440ff61e56345a03fca9167cf
git clone -b master https://github.com/topcoder-platform/topcoder-x-receiver
cd topcoder-x-receiver && git checkout 3c5d798d133adc5440ff61e56345a03fca9167cf && cd ..

# The submission works on commit e408d62fd190e9b2412e02004c916a6afa5e70db
git clone -b master https://github.com/topcoder-platform/topcoder-x-processor
cd topcoder-x-processor && git checkout e408d62fd190e9b2412e02004c916a6afa5e70db && cd ..
```



## Apply Patch

```bash
cd topcoder-x-ui
git am --ignore-space-change ../patches/topcoder-x-ui.patch
cd ..

cd topcoder-x-receiver
git am --ignore-space-change ../patches/topcoder-x-receiver.patch
cd ..

cd topcoder-x-processor
git am --ignore-space-change ../patches/topcoder-x-processor.patch
cd ..
```



## Config Docker IP

Normally you can use `127.0.0.1` as the docker ip. If you use docker machine, use `docker-machine ip` to get the docker machine ip.

Then in your hosts file config `x.topcoder-dev.com` to resolve to docker ip:

```
127.0.0.1 x.topcoder-dev.com
```



## Setup GitHub OAuth App

Follow this section to generate your own `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in [local-deploy/env/topcoder-x-ui.env.local](local-deploy/env/topcoder-x-ui.env.local) configuration:

1. Login into github.com
2. Navigate to https://github.com/settings/developers
3. Click `New OAuth App` button
4. Fill in the fields with following values (See http://take.ms/ajdgy):
   - Application name: Topcoder-X
   - Homepage URL: http://x.topcoder-dev.com
   - Authorization callback URL: http://x.topcoder-dev.com
5. After creating the OAuth app, you can see its client id and client secret, set them as  `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` values in [local-deploy/env/topcoder-x-ui.env.default](local-deploy/env/topcoder-x-ui.env.default) configuration



Also config your own `GITHUB_ACCESS_TOKEN` in [local-deploy/env/topcoder-x-processor.env.test](local-deploy/env/topcoder-x-processor.env.test) , you can create access token from https://github.com/settings/tokens



## Setup GitLab OAuth App

Follow this section to generate your own  `GITLAB_CLIENT_ID` and `GITLAB_CLIENT_SECRET` in [local-deploy/env/topcoder-x-ui.env.local](local-deploy/env/topcoder-x-ui.env.local) configuration:

- Login into gitlab.com
- Navigate to https://gitlab.com/profile/applications
- Fill in the fields with following values (See http://take.ms/ERoDs):
  - Name: Topcoder-X
  - Redirect URI: enter two callback URLs, one callback URL per line, so there are two lines:
    http://topcoderx.topcoder-dev.com/api/v1/gitlab/owneruser/callback
    http://topcoderx.topcoder-dev.com/api/v1/gitlab/normaluser/callback
  - Scopes: check `api` and `read_user`, `api` is for owner user, `read_user` is for normal user
- After creating the OAuth app, you can see its generated Application Id and Secret, set them as  `GITLAB_CLIENT_ID` and `GITLAB_CLIENT_SECRET` values in [local-deploy/env/topcoder-x-ui.env.default](local-deploy/env/topcoder-x-ui.env.default) configuration



Also config your own `GITLAB_USERNAME` and `GITLAB_PASSWORD` in [local-deploy/env/topcoder-x-processor.env.test](local-deploy/env/topcoder-x-processor.env.test) 



## Setup Ngrok

Download Ngrok from https://ngrok.com/download and install it. Then signup and go to https://dashboard.ngrok.com/auth to find your auth token. run:

```bash
./ngrok authtoken <your-own-ngrok-token>
./ngrok http 3002
# You will see something like following:

# Session Status                online                                                                                                                          
# Session Expired               Restart ngrok or upgrade: ngrok.com/upgrade                                                                                     
# Version                       2.2.8                                                                                                                           
# Region                        United States (us)                                                                                                              
# Web Interface                 http://127.0.0.1:4040                                                                                                           
# Forwarding                    http://a9ee41f3.ngrok.io -> localhost:3002                                                                                      
# Forwarding                    https://a9ee41f3.ngrok.io -> localhost:3002   
```



Set your own forwarding http URL (like `http://a9ee41f3.ngrok.io`) to `HOOK_BASE_URL` value in [local-deploy/env/topcoder-x-ui.env.default](local-deploy/env/topcoder-x-ui.env.default) and [local-deploy/env/topcoder-x-processor.env.test](local-deploy/env/topcoder-x-processor.env.test) 



At this point the configuration are all setup.



## Deploy locally

```bash
cd local-deploy
./local-deploy.sh local 

# The first time it takes several minutes to build and deploy, be patient
```



When you see something like following, the docker services are all started:

```verilog
Creating network "topcoder-x-docker_default" with the default driver
Creating maildev.local   ... done
Creating mongo.local     ... done
Creating zookeeper.local ... done
Creating kafka.local     ... done
maildev.local is up-to-date
mongo.local is up-to-date
zookeeper.local is up-to-date
kafka.local is up-to-date
Creating topcoder-x-ui.local        ... done
Creating topcoder-x-processor.local ... done
Creating topcoder-x-receiver.local  ... done
```



## Github Verification

Goto http://x.topcoder-dev.com , login with `mess/appirio123` : http://take.ms/Erprt

Goto http://x.topcoder-dev.com/#/app/settings , setup the OAuth authentication of Github and Gitlab: http://take.ms/d2RqT



Goto http://x.topcoder-dev.com/#/app/projects , add a project with github repo (you can create a public repo to test), enter 7377 for Direct ID: http://take.ms/hn4p0



After project created, click `Edit` button: http://take.ms/hn4p0

Then click `Add Labels` button, then in github labels page (https://github.com/you-user-name/your-repo-name/labels) you should see "tax_XXX" labels created: http://take.ms/4naCe

Then click `Add Webhook` button, then in github webhooks page (https://github.com/your-user-name/your-repo-name/settings/hooks) you should see webhooks created: http://take.ms/Xgexa

Then click `Add Wiki Rules` button, then in github issues page you should see a ticket rules issue created: http://take.ms/sIx0T



Now in Github, create an issue with name `[$100] Some test issue` (the issue name format is important), then wait about one minute, refresh the issue page you should see a challenge is auto created: http://take.ms/zlibK . Then click the challenge url: http://take.ms/bDU5w



At this point we have verified the Github OAuth authentication, the communication between Github/Topcoder-x/Kafka and TC-API works.



## Gitlab Verification

Goto http://x.topcoder-dev.com , login with `mess/appirio123` : http://take.ms/Erprt

Goto http://x.topcoder-dev.com/#/app/settings , setup the OAuth authentication of Github and Gitlab: http://take.ms/d2RqT



Goto http://x.topcoder-dev.com/#/app/projects , add a project with gitlab repo (you can create a public repo to test), enter 7377 for Direct ID: http://take.ms/XDvPB



After project created, click `Edit` button: http://take.ms/mLtlq

Then click `Add Labels` button, then in gitlab labels page (https://gitlab.com/your-user-name/your-repo-name/labels) you should see "tax_XXX" labels created: http://take.ms/gOMMX

Then click `Add Webhook` button, then in gitlab webhooks page (https://gitlab.com/your-user-name/your-repo-name/settings/integrations) you should see webhooks created: http://take.ms/EjHLy

Then click `Add Wiki Rules` button, then in gitlab wiki page (https://gitlab.com/your-user-name/your-repo-name/wikis/Gitlab-ticket-rules) you should see the ticket rules wiki page created: http://take.ms/yrzF3



Now in Gitlab, create an issue with name `[$100] Some test issue` (the issue name format is important), then wait about one minute, refresh the issue page you should see a challenge is auto created: http://take.ms/K8UHS. Then click the challenge url: http://take.ms/U5afZ



At this point we have verified the Gitlab OAuth authentication, the communication between Gitlab/Topcoder-x/Kafka and TC-API works.



## Unit Tests

At first deploy test environment:

```bash
cd local-deploy
./local-deploy.sh test 
```



Then:

```bash
# Unit tests for gitlab
docker exec -it topcoder-x-processor.test npm run test:gitlab

# It has code bug and immediately fails
```



```bash
# Unit tests for github
docker exec -it topcoder-x-processor.test npm run test:github

# It runs more than 30 minutes and still not finish
```

