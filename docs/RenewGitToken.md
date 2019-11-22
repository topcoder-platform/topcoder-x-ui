## Revoking and renewing a login token

#### Revoke

To revoke a token:

1.  Click your username in the upper-righthand corner of the page
2.  Select the `Settings` option
3.  You will see `Github` and `Gitlab` listed
4.  Click `Revoke` next to each and confirm the action on the confirmation popup
5.  The checkmark or warning icon and `Revoke` button next to `Gitlab` or `Github` will turn to a `Setup` button

![Settings](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen%20Shot%202019-11-07%20at%208.30.22%20am.png "Settings")

![Revoke](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen%20Shot%202019-11-07%20at%208.30.24%20am.png "Revoke")

![Confirm](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen%20Shot%202019-11-07%20at%208.30.32%20am.png "Confirm")

#### Add a token

Once the token(s) are revoked, you can add them again by clicking the `Setup` button next to the Git provider.  This will walk you through the flow to reauthorize.

![Add](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen%20Shot%202019-11-07%20at%208.31.56%20am.png "Add")

#### Remove a webhook (Github)

To remove an old webhook in Github:

1.  Go to the project
2.  Click on `Settings` in the header
3.  Click on `Webhooks` on the left nav
4.  Find the `topcoder-x-receiver.herokuapp.com` entry
5.  Click `Delete` and follow the prompts

![Delete](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen_Shot_2019-11-21_at_5_28_59_pm.png "Delete")


#### Remove a webhook (Gitlab)

To remove an old webhook in Gitlab:

1.  Go to the project
2.  Click on `Settings` on the left nav
3.  Select `Integrations` under `Settings`
4.  Find the `topcoder-x-receiver.herokuapp.com` entry
5.  Click the trashcan icon

![Delete](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen_Shot_2019-11-21_at_5_33_35_pm.png "Delete")

#### Add a new webhook

In Topcoder-X:

1.  Click `Project Management`
2.  Select the existing project
3.  Click `Add Webhook`

The new, correct webhook for the new server will be added automatically.  You can verify by following the steps above, but without deleting the new webhook.

![Add](https://github.com/topcoder-platform/topcoder-x-ui/raw/develop/docs/images/Screen_Shot_2019-11-21_at_5_35_18_pm.png "Add")

