const chalk = require('chalk');

module.exports = {
    log: (text) => {
        let msgOut = text instanceof Object ? stringify(text, null, 2) : text;
        console.log(`[${chalk.cyan("testrail Reporter")}] ${msgOut}`);
    },
    warn: (text) => {
        let msgOut = text instanceof Object ? stringify(text, null, 2) : text;
        console.warn(`[${chalk.cyan("testrail Reporter")}] ${msgOut}`);
    }
}