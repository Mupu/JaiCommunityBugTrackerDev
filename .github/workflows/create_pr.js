function parseIssueBody(text) {
  const sections = text.split('### ').slice(1); // Split into sections by headings
  const parsedData = [];

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const heading = lines.shift().trim(); // First line is the heading
    const content = lines.join('\n').trim(); // Remaining lines are the content

    if (heading === 'General') {
      // Parse checkboxes
      const checkboxes = lines
        .filter(line => line.trim().length > 0)
        .map(line => {
          const isChecked = line.toLowerCase().includes('[x]');
          return {
            label: line.replace(/- \[.\]\s*/, '').trim(),
            checked: isChecked
          };
        });
      parsedData.push(checkboxes);
    } else if (heading === 'Short Code Snippet') {
      // Extract text inside ```c``` block
      const codeBlockMatch = content.match(/```c([\s\S]*?)```/);
      parsedData.push(codeBlockMatch ? codeBlockMatch[1].trim() : '');
    } else {
      // Parse other sections
      parsedData.push(content);
    }
  });

  return parsedData;
}

const createPr = async ({github, context}) => {
  const { format, prTemplate: pull_request_template } = require('./utils.js');

  // Get issue
  const { data: issue } = await github.rest.issues.get({
    ...context.repo,
    issue_number: context.issue.number
  });
  // console.log(issue);

  // Get title text
  const regex = /(?:\[SB\]): (.{5,})/gmi;
  const match = [...issue.title.matchAll(regex)][0] || [];
  const title_text = match[1]; // maybe undefined
  if (title_text === undefined) return;

  const parsed_body = parseIssueBody(issue.body);

  const params = {
    already_reported: parsed_body[0][2].checked ? 'X' : ' ',
    issue_number: context.issue.number,
    bug_type: parsed_body[1],
    categories: parsed_body[2],
    description: parsed_body[3],
    workaround: parsed_body[4],
    code: parsed_body[5]
  }

  const branchName = `issue-${context.issue.number}`;
  const baseBranch = 'master';
  const prTitle = issue.title;
  const fileName = `deleteme-${context.issue.number}.jai`;
  const fileContent = Buffer.from(parsed_body[5]).toString('base64');

  const prBody = format(pull_request_template, params);

  // Create a new branch from the base branch
  const { data: { commit } } = await github.rest.repos.getBranch({
    ...context.repo,
    branch: baseBranch
  });

  await github.rest.git.createRef({
    ...context.repo,
    ref: `refs/heads/${branchName}`,
    sha: commit.sha
  });

  await github.rest.repos.createOrUpdateFileContents({
    ...context.repo,
    path: fileName,
    message: 'Add test',
    content: fileContent,
    branch: branchName
  });

  // Create a pull request
  const { data: pr } = await github.rest.pulls.create({
    ...context.repo,
    title: prTitle,
    head: branchName,
    base: baseBranch,
    body: prBody
  });


  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: context.issue.number,
    body: `👋 Thanks for the contribution, please continue further discussion on this matter here: ${pr.html_url}!`
  })

  await github.rest.issues.lock({
    ...context.repo,
    issue_number: context.issue.number,
  })

  // await github.rest.issues.update({
  //   ...context.repo,
  //   issue_number: context.issue.number,
  //   state: 'closed',
  //   state_reason: 'completed'
  // })

  // get current jai version
  const { createCurrentVersionLabel } = require('./create_label.js');
  const jai_version = await createCurrentVersionLabel({github, context});

  // Add labels
  await github.rest.issues.addLabels({
    ...context.repo,
    issue_number: context.issue.number,
    labels: [ jai_version ]
  });

}

module.exports = createPr;