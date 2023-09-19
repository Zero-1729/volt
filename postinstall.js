const exec = require('child_process').exec;

let baseCommand = `yarn build:tailwind && yarn gitbranch`;

exec(baseCommand);
