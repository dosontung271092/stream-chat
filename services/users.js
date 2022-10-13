const _usersLogin = [
    {
        username: 'A0001',
        password: 'A0001',
    },
    {
        username: 'A0002',
        password: 'A0002',
    },
    {
        username: 'A0003',
        password: 'A0003',
    },
    {
        username: 'A0004',
        password: 'A0004',
    }
];

const _usersOnlline = [];

function userLogin( username, password ){
    return _usersLogin.some(u => u.username === username, u.password === password);
}

function storeUser( user ){
    _usersOnlline.push(user);
    return _usersOnlline;
}

function checkUserOnlline( username ){
    return _usersOnlline.some(u => u.username === username);
}

function getCurrentUser(peerId){
    return _usersOnlline.find(user => user.peerId === peerId);
}

function getUsers(){
    return _usersOnlline;
}

function userLeave( peerId ){
    const index = _usersOnlline.findIndex(user => user.peerId === peerId);
    _usersOnlline.splice(index, 1);

}

module.exports = {
    userLogin,
    storeUser,
    getCurrentUser,
    getUsers,
    userLeave,
    checkUserOnlline
}