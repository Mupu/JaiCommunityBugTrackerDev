const jaiVersion = async ({ exec }) => {
  // currently this is a bug in jai so we hardcode it       
  // let jaiVersionOutput = 'Version: beta 0.1.092, built on 4 August 2024.';
  let jaiVersionOutput = '';

  const options = {};
  options.silent = false;
  options.ignoreReturnCode = true;
  options.listeners = {
    stdout: (data) => {
      jaiVersionOutput += data.toString();
    },
    stderr: (data) => {
      jaiVersionOutput += data.toString();
    },
    stdline: (string) => {
      jaiVersionOutput += string;
    },
    errline: (string) => {
      jaiVersionOutput += string;
    }
  };

  // Replace 'your-executable' with the command you want to run
  await exec.exec('jai jai_version_workaround.jai', [], options);
  
  console.log(jaiVersionOutput);

  const versionMatch = jaiVersionOutput.match(/beta \d+\.\d+\.\d+/);
  const version = versionMatch ? versionMatch[0].replace(/\s+/g, '-') : 'VersionNotFound';

  return version;
}

// format a string that replaces '{xxx}' with object properties of name 'xxx'
//
// Example:
// 
// const template = 'Hello, {name}! Welcome to {place}.';
// const params = {
//   name: 'Alice',
//   place: 'Wonderland'
// };
//
// const result = format(template, params);
// console.log(result); // Outputs: "Hello, Alice! Welcome to Wonderland."
function format(template, params) {
  return template.replace(/\{(.*?)}/g, (match, p1) => params[p1.trim()] || '');
}

module.exports = {
  jaiVersion,
  format
}