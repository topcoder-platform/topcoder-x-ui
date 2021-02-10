# How to work with git tickets

The basic flow for handling a ticket is as follows:

1. Assign the ticket to yourself, and the system will change the label to "tcx_Assigned", removing the "tcx_OpenForPickup" label.  Please only assign tickets to yourself when you are ready to work on it.  I don't want tickets assigned to someone and then not have them work on a ticket for 24 hours.  The goal here is a quick turnaround for the client.  If you can't work on a ticket immediately, leave it for someone else.

1. Complete the ticket and create a merge request within 24 hours.  Please ensure your merge request can be merged automatically (resolving any conflicts) and that it's against the latest commit in Git when you create it.

1. Change the label on the ticket to "tcx_ReadyForReview"

After seeing a ticket marked as "tcx_ReadyForReview", the copilot will review that ticket, usually within 24 hours.

Note that you are expected to keep your changes in-sync with Git - make sure to do a pull before you push changes to make sure there aren't any merge issues or conflicts.

### Accepted fix

If a fix is accepted, the copilot will add label "tcx_FixAccepted" and close the ticket. The system will create a payment ticket on the Topcoder platform within 5-10 minutes of the issue being closed.  You should see the payment in your PACTs within 24 hours.

### Rejected fix

If a fix is rejected, a comment, and possibly a screenshot, will be added to the ticket explaining why the fix was rejected.  The status will be changed to "tcx_Feedback".

**If a fix is rejected, that ticket is your priority.  You should not assign yourself any more tickets until you complete the required additional fixes!**

# Payment amounts

Each ticket in Gitlab / Github has a dollar value.  That is the amount you will be paid when the ticket is completed, merged, and verified by the copilot.  Note that there is still a 30 day waiting period as the payment will be treated as a regular TopCoder challenge payment.

# Important Rules:

- You can assign any unassigned issue to yourself with an "tcx_OpenForPickup" label (first come first serve)

- You can only assign **ONE AT A TIME**. The nature of it being assigned will indicate it is not available to anyone else.

- You will fix the ticket by committing changes to the master branch.

- After marking a ticket "tcx_ReadyForReview" you are eligible to accept another. You do _NOT_ need to wait for the copilot to validate your fix.

- You can do as many tickets as you want, as long as you follow the rules above.

- If an assigned task is not done in 24 hours, you will need to explain why it is not completed as a comment on the ticket.

- You can ask questions directly on the Gitlab / Github ticket.

### ANYONE NOT FOLLOWING THE RULES ABOVE WILL BE WARNED AND POTENTIALLY LOSE THEIR GIT ACCESS!
