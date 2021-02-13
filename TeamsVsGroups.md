
## Github's Teams and Gitlab's Groups differences

Github's Teams are groups of organization members whereas Gitlab's Groups are just groups of Gitlab users (Groups are more like Github' organizations).
Each Github organization can have repositories and assign teams to them and each team can have subteams.
Gitlab groups can have repositories and create subgroups (nested).

## Setup guide

### Github

1. Go to 'https://github.com/settings/organizations' and click 'New organization' button
2. Select your plan.
3. Enter organization's name, contact email address, solve the captcha and click Next
4. Click 'Skip this step'
5. If you receive a survey, you can just go to the bottom and click Submit without filling anything.
6. On your new organization page go to 'Teams' tab and click 'New team' button.
7. Fill in your team's name, description (optional) and visibility. Submit by clicking 'Create team'.
Now you have your team created and you should get redirect to its page.
You can assign it to an organization's repository by clicking 'Add Repository' and entering repository's name, in 'Repositories' tab of a team's page.

### Gitlab

1. Go to 'https://gitlab.com/dashboard/groups' and click on 'New group' button.
2. Enter group's name and set visibility level. Finish by clicking 'Create group'.
You can now create repositories for this group or subgroups.

## Roles

In Topcoder X you can select role which user who joins via specific invitation link receives.

### Github

For github team you can set two roles: Member and Maintainer.
You can read about them here: https://docs.github.com/en/github/setting-up-and-managing-organizations-and-teams/permission-levels-for-an-organization and https://docs.github.com/en/github/setting-up-and-managing-organizations-and-teams/giving-team-maintainer-permissions-to-an-organization-member

### Gitlab

For gitlab group you can set five roles: Guest, Reporter, Developer, Maintainer, Owner
You can read about them here: https://docs.gitlab.com/ee/user/permissions.html