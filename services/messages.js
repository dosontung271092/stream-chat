const moment = require('moment');

function formatMessage( dname, username , msgContent ){
    return {
        dname,
        username,
        msgContent,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage;