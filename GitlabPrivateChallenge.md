## The Challenge:

We're excited to announce the launch of an electrifying public coding challenge, where coding wizards from around the world will compete in a thrilling race to solve enthralling problems.

Let’s delve into the challenges faced in the traditional submission process and how our groundbreaking approach addresses them:

#### Old Way: 

In the past, participants were required to compress their code into zip archives and then upload these archives to the Topcoder platform. Additionally, any supplementary code or data had to be shared through forums in a similar zipped format. 

This approach had several significant shortcomings:

* Lack of Version Control: The zip-archive-based approach inherently lacked any form of version control. Participants could not keep a history of changes or easily revert to previous versions. This made it cumbersome for them to manage iterative improvements to their code.

* Difficulties in Tracking Changes: For reviewers, it was a daunting task to keep track of incremental changes between different versions of code archives. Without a proper system to highlight the differences between code submissions, reviewers had to manually comb through lines of code to identify any alterations, additions, or deletions.

* Inefficiencies in Code Quality Analysis: The absence of a version-controlled environment made it impractical to conduct code quality scans specifically on the changes. The static nature of zip files didn’t allow for dynamic analysis or automatic flagging of issues in the newly added or modified code segments.

* Tedious and Error-prone Review Process: Reviewers had to expend considerable effort just organizing and extracting content from the zip archives. The lack of direct visibility into code changes often led to a less accurate and more time-consuming review process.

#### New Way: 

We're embracing innovation with GitLab’s Private Merge Requests! With this new approach, participants are fully equipped to seamlessly and securely submit their code through GitLab. Instead of juggling zip archives, all that’s needed is to share the URL of the GitLab Merge Request via the Topcoder platform. This not only simplifies submissions but also revolutionizes the review process.

Here are the key advantages of this modernized approach:

* Efficient Code Review: The GitLab platform beautifully displays code changes, side by side. Reviewers can effortlessly spot additions, modifications, or deletions. This visual representation of the differences between code versions allows for an insightful and thorough analysis and reduce the review time by 30%.

* Robust Version Control: Utilizing GitLab’s repositories empowers participants with robust version control. They can track the evolution of their code, create branches, and maintain a historical record of changes. This not only facilitates code management but also supports the development of more sophisticated solutions.

* Heightened Security and Confidentiality: The confidentiality of the Merge Requests ensures that the submitted code is visible exclusively to the authorized reviewers. This secure environment safeguards participants’ code and lower security incidents related to code submission by 90%, minimizing risks of code/IP leakage and enhancing the security of our operations.

* Streamlined Communication: The Merge Request interface integrates communication tools. Participants and reviewers can discuss the code within the context of the changes. This centralized communication channel accelerates feedback loops and enhances collaboration.

* Automated Code Quality Checks: Integration with tools such as SonarCloud can be set up to automatically scan the code in Merge Requests for quality issues. This automated analysis elevates code standards and empowers participants to refine their submissions based on real-time feedback.

* Ease of Submission: Submitting code becomes as simple as sharing a URL. This eradicates the laborious process of creating and uploading zip archives, making the submission process incredibly smooth and hassle-free and boost challenge participation by 20%.

* Real time insights on participant's progress: Earlier we had no way of knowing if someone was actively working on a problem until they uploaded a submission at the end of the phase.With the MR approach, by encouraging members to regularly commit their work to their private fork, we gain an insightful, real-time view into the ongoing health of the challenge. The continuous submission method allows us to actively monitor a participant's progress, offering us a clearer idea of whether the participant is likely to complete the challenge. This visibility aids us in effectively managing conversations with our clients on critical deliverables.



### 🔒 Our Solution: The Magic of Confidential Merge Requests! 🔒

https://docs.gitlab.com/ee/user/project/merge_requests/confidential.html 

Confidential merge requests in GitLab are the superheroes we deserve. Participants can create merge requests that are visible only to the eagle-eyed reviewers. Your code is safe from prying eyes, and you can compete fairly and squarely!


### 🔥 Enter the Private Fork Strategy! 🔥

We create a private twin of the main repository - a private fork.

Participants are granted exclusive access to the individual private fork once they register for the challenge.

They work their magic, creating merge requests in the private fork and access to the reviewers will be provided

Our dedicated reviewers go through the submissions, ensuring only the crème de la crème makes it through.

The approved winners code is merged into the main repository, but remains exclusive to those who have access to it.

But that’s not all.



### 🌟 Quality Assurance with SonarCloud Scans! 🌟

Quality is king, and we want to make sure our code wears the crown. With SonarCloud scans, we’ll get insights into the quality of each submission. This not only helps us maintain high standards but also empowers participants to sharpen their coding skills!



#### In Summary:

* Your solutions stay private.
* The competition remains fair.
* Code quality is held to the highest standard.



**Question:** 

Is it necessary for the copilot to create individual private fork repositories for each member who registers for the challenge, and grant them access?

Answer: Yes, during the initial phase, it is essential for the copilot to manually create a private fork repository for each participant who has registered for the challenge. We recognize that this process is manual and might be time-consuming. However, we are exploring ways to automate this task. One of the potential solutions is leveraging our existing Topcoder-X tool, which is currently used for adding users to our GitLab repositories. We are looking into expanding its capabilities to automate the creation of repository forks and efficiently assign the appropriate users. This will streamline the process and ensure a more efficient and effective setup for the challenge participants.

**Question:** How do I submit my code through GitLab’s Confidential Merge Requests?

**Answer:** To submit your code, you’ll need to create a merge request within your private fork repository. Set this merge request as confidential, ensuring it is only visible to the reviewers. Copy the URL of the merge request and submit it through the Topcoder platform.

**Question:** Will reviewers have access to my code before the final submission deadline?

**Answer:** No, reviewers will only have access to your code after the final submission deadline has passed. This ensures that all participants have a fair chance and that codes are not reviewed prematurely.

**Question:** Can I make changes to my code after creating a merge request?

**Answer:** Yes, you can continue to make changes to your code and push them to your private fork. The merge request will automatically update with the latest changes. However, make sure all changes are finalized before the submission deadline.

**Question:** How does the SonarCloud scan help in maintaining code quality?

**Answer:** SonarCloud scans analyze your code for code smells, bugs, and security vulnerabilities. It also checks your coding standards. This helps in maintaining high-quality code and also provides you with feedback to improve your coding skills.

**Question:** Is there a limit to the number of submissions I can make?

**Answer:** There is no limit to the number of times you can update your code within your private fork. However, you should have one final merge request that you wish to be considered for review. Ensure that your final submission is ready before the challenge deadline.

**Question:** What happens if my code is selected by the reviewers?

**Answer:** If your code is selected by the reviewers, it may be merged into the main repository. However, it will still remain confidential until the big reveal.

**Question:** What if there is a problem with my private fork or merge request? Who should I contact?

**Answer:** If you encounter any issues with your private fork or merge request, please contact the challenge organizers.



#### Next Steps: Enhanced Automation Using Topcoder-x Tool

Our pilot challenge using the private Merge Request (MR) approach has shown promising results, and we're now planning to improve and automate the process using the Topcoder-X tool. The enhancements will not only make the process more efficient but also address various security and transparency concerns. Here are the features we're planning to implement in the first phase:

* Automated Private Fork Creation: Whenever a member registers for a challenge, the Topcoder-x tool will automatically create a private fork and assign access to the member's verified GitLab ID. This provides an added layer of security by ensuring that only verified members can access their individual private forks, thereby reducing the risk of code or Intellectual Property (IP) leakage.

* Automatic Submission Tracking: Topcoder-x tool will be enhanced to automatically create a submission in the Online Review (OR) system every time a competitor makes a commit in GitLab/GitHub. This automation eliminates the need for manual submission tracking and provides competitors with valuable information about the number of submissions and timing of other participants' submissions.

* Post-Challenge Access to Submissions: After the conclusion of the challenge, all valid submitters will have access to download and review all submissions from other participants fostering a supportive and educational coding community.

  * Topcoder-X can create a patch file based on the merge requested and include that in the submission. That way, we don’t have to do anything at the end of the challenge, since each submission will contain the implementation from that member.

By implementing these enhancements, we aim to improve the user experience, address security concerns, reduce the review time and foster a collaborative learning environment among our coding wizards.