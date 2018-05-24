angular.module('app.constants', [])
    .constant('JWT_V3_NAME', "v3jwt")
    .constant('JWT_V2_NAME', "tcjwt")
    .constant('COOKIES_SECURE', false)
    .constant('OWNER_LOGIN_GITHUB_URL', "/api/v1/github/owneruser/login")
    .constant('OWNER_LOGIN_GITLAB_URL', "/api/v1/gitlab/owneruser/login");
