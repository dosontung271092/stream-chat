const moment = require('moment');

function formatMessage( user, msgContent ){
    return {
        user, 
        msgContent,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage;