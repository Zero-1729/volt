const exec = require('child_process').exec;
const os = require('os');

let baseCommand = `yarn build:tailwind && yarn gitbranch`;

if (os.type() === 'Darwin') {
    baseCommand += '&& react-native setup-ios-permissions';
}

exec(baseCommand);
