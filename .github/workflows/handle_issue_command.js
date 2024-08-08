function parseIssueBody(issueBody) {
  // Split the input text into lines
  const lines = issueBody.split('\n');
  let pipeLines = lines.filter(line => line.startsWith('|'));
  // Discard the first two lines (header and table)
  pipeLines = pipeLines.slice(2);

  // Extract the row that contains the variable values
  const regex = /\|?(.*?)\|/gm;
  const fields = [...pipeLines[0].matchAll(regex)].map(match => match[1]);

  return fields
}

const handleEmailedIn = async ({ github, context }) => {

  const { data: issue } = await github.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number
  });

  let parsedFields = parseIssueBody(issue.body);

  parsedFields[2] = '✅'; // Emailed In

  let modifiedRow = '|' + parsedFields.join('|') + '|';

  // Reassamble updated post
  let lines = issue.body.split('\n');

  // find data row
  let headerIndex = -1;
  for (const [index, line] of lines.entries()) {
    if (line.startsWith('|')) {
      headerIndex = index;
      break;
    }
  }

  lines.splice(headerIndex + 2, 1, modifiedRow);
  const result = lines.join('\n');

  // Update comment
  await github.rest.issues.update({
    ...context.repo,
    issue_number: context.issue.number,
    body: result
  });

}

const handleJonSaid = async ({ github, context, comment }) => {
  console.log(comment);
  const jon_said = "\n\n Jon said:\n" + comment.body.split(/!JonSaid\s?/i)[1];
  console.log('js', jon_said);

  // Get old issue body
  const { data: issue } = await github.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number
  });
  console.log('ib', issue.body);

  const result = issue.body + jon_said;
  console.log('res', result);

  // Update comment
  await github.rest.issues.update({
    ...context.repo,
    issue_number: context.issue.number,
    body: result
  });
}

module.exports = {
  handleEmailedIn,
  handleJonSaid
};