const USERS = [];


function storeUser( id, username, room ){
    const user = { id, username, room };
    USERS.push(user);
    return user;
}

function getCurrentUser(id){
    return USERS.find(user => user.id === id);
}

function getRoomUsers(room){
    return USERS.filter(user => user.room === room);
}

function userLeave( id ){
    const index = USERS.findIndex( user => user.id === id );

    if( index !== -1 ){
        return USERS.splice(index, 1)[0];
    }
}

module.exports = {
    storeUser,
    getCurrentUser,
    getRoomUsers,
    userLeave
}