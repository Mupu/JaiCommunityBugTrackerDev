
const validatePRStructure = async ({ github, context }) => {

  const { data } = await github.rest.rateLimit.get();


  const { data: pr } = await github.rest.pulls.get({
    ...context.repo,
    pull_number: context.issue.number,
  });

  const isSBOrBB = /^\[[SB]B\]:/.test(pr.title);
  if (!isSBOrBB) {
    throw new Error('This PR is not a SB or BB.');
  }

  // Get all files in the PR
  // TODO BAD BAD BAD, USE SHA !!!!
  const fileResponse = await github.rest.pulls.listFiles({
    ...context.repo,
    pull_number: context.issue.number,
    per_page: 100,
  });
  const filePaths = fileResponse.data.map((file) => file.filename);

  // @todo also fix validateAddedTestAndMergeOnSuccess
  if (filePaths.length >= 100) {
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body: `@Mupu, This PR has more than 100 files, please make this work and re-run the checks.`,
    });
    throw new Error('This PR has more than 100 files. Please make this work.');
  }

  const validBugNameRegexTemplate = `^compiler_bugs/[CR]EC-?\\d+_${context.issue.number}`;
  const singleFileValidBugNameRegex = new RegExp(`${validBugNameRegexTemplate}\\.jai`);
  const validFilePathRegex =          new RegExp(`${validBugNameRegexTemplate}/`);
  const validFirstJaiRegex =          new RegExp(`${validBugNameRegexTemplate}/first\\.jai`);
  console.log('validBugNameRegexTemplate', validBugNameRegexTemplate);
  console.log('singleFileValidBugNameRegex', singleFileValidBugNameRegex);
  console.log('validFilePathRegex', validFilePathRegex);
  console.log('validFirstJaiRegex', validFirstJaiRegex);

  const isSingleFile = filePaths.length === 1 && singleFileValidBugNameRegex.test(filePaths[0]);

  const isSingleFolderWithFirstJaiFile =
    filePaths.every((f) => validFilePathRegex.test(f)) &&
    filePaths.some((f) => validFirstJaiRegex.test(f));

  console.log('isSingleFile', isSingleFile);
  console.log('isSingleFolderWithFirstJaiFile', isSingleFolderWithFirstJaiFile);
  console.log('filePaths', filePaths);

  // Error, PR doesnt match needed structure
  if (!isSingleFile && !isSingleFolderWithFirstJaiFile) {
    throw new Error('This PR does not match the needed structure.');
  }
};



// This is run after a SB/BB PR has been manually approved
// It should run in the context of the PR branch
const validateAddedTestAndMergeOnSuccess = async ({
  github,
  exec,
  io,
  contextRepo,
  prNumber,
}) => {
  console.log(`Validating Pull Request #${prNumber}...`);

  const { data: pr } = await github.rest.pulls.get({
    ...contextRepo,
    pull_number: prNumber,
  });

  // Check that its a SB or BB
  const match = pr.title.match(/^\[([SB]B)\]:/)?.[1];
  if (!match) process.exit(1); // should never happen, as we already checked this in validatePRStructure
  const isSingleFile = match === 'SB'; // false means its a BB

  console.log(isSingleFile);

  const fileResponse = await github.rest.pulls.listFiles({
    ...contextRepo,
    pull_number: prNumber,
    per_page: 100,
  });
  const filePaths = fileResponse.data.map((file) => file.filename);
  console.log(filePaths);

  // @todo rework this to work with multi platform
  // Make sure the test actually fails

  // @todo check security, techincally this would never run without manual approval anyways but eh
  // also check all other calls to jai, becase maybe they could update the workflow file to run something else
  // before another js file is loaded, making it a security issue
  const fileToRun = isSingleFile
    ? filePaths[0]
    : filePaths.find((f) => /^compiler_bugs\/EC\d+_\S+\/first.jai/.test(f));
  const exitCode = await exec.exec('jai ' + fileToRun, [], {
    ignoreReturnCode: true,
  });
  const expectedExitCode = Number.parseInt(
    fileToRun.match(/(?<=EC)(\d+)(?=_\S+)/)[0],
  );
  console.log(exitCode);
  console.log(expectedExitCode);
  if (exitCode === expectedExitCode) {
    console.log(`Test failed as expected, exit code: ${exitCode} .. skipping`);
    process.exit(1);
  }

  // const { data: prCommitHistory } = await github.rest.pulls.listCommits({
  //   ...contextRepo,
  //   pull_number: prNumber
  // });
  // console.log('prCommitHistory', prCommitHistory);

  // if (prCommitHistory.length === 1) {

  // @todo make this only be run once when the pr has only one commit?
  // but this hole thing here should only be run once, or error before?
  const createTrackingIssueFromPR = require('./2.1_PR_to_tracking_issue.js');
  const trackingIssueNumber = await createTrackingIssueFromPR({
    github,
    contextRepo,
    prNumber,
  });

  // We already know that the structure is valid, so we can just take the first file
  if (isSingleFile) {
    const oldFileName = filePaths[0];
    const newFileName = oldFileName.replace(
      /(?<=^compiler_bugs\/EC\d+_)(\S+)(?=\.jai)/,
      trackingIssueNumber,
    );
    console.log(newFileName);
    await io.mv(oldFileName, newFileName);
  } else {
    // BB, folder structure
    const oldFolderName = filePaths[0].split('/').slice(0, -1).join('/');
    const newFolderName = oldFolderName.replace(
      /(?<=^compiler_bugs\/EC\d+_)(\S+)/,
      trackingIssueNumber,
    );
    console.log(newFolderName);
    await io.mv(oldFolderName, newFolderName);
  }

  // Git commands to add, commit, and push changes
  await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
  await exec.exec('git', [
    'config',
    'user.email',
    'github-actions[bot]@users.noreply.github.com',
  ]);
  await exec.exec('git', ['status']);
  await exec.exec('git', ['add', '--all']);
  await exec.exec('git', [
    'commit',
    '-m',
    'Updated file paths to match tracking issue number',
  ]);
  await exec.exec('git', ['push']);

  // Try to merge the PR, we have to wait until the push has been processed
  const maxRetries = 3;
  const delayMs = 10000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Merging pull request #${prNumber}`);

      const mergeResponse = await github.rest.pulls.merge({
        ...contextRepo,
        pull_number: prNumber,
        merge_method: 'squash', // Use 'merge', 'squash', or 'rebase'
      });

      console.log(`Merge successful: ${mergeResponse.data.message}`);
      return mergeResponse; // Exit after successful merge
    } catch (error) {
      console.log(`Error during merge attempt ${attempt}: ${error.message}`);

      // Retry if it's a merge conflict or related to a temporary issue
      if (attempt < maxRetries) {
        console.log(`Retrying after ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait for the specified delay
      } else {
        console.log(`Failed to merge after ${maxRetries} attempts.`);
        process.exit(1); // Exit if all retries fail
      }
    }
  }
};

module.exports = {
  validatePRStructure,
  validateAddedTestAndMergeOnSuccess,
};
