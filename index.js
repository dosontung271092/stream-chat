const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const {storeUser, userLogin, userLeave, checkUserOnlline, getCurrentUser} = require('./services/users')
const formatMessage = require('./services/messages')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, 'public')));
const BotName = "Bot";

// chạy khi client kết nối
io.on('connection', socket => {
    // Login
    socket.on('IOC_AcountLogin', user => {
        // Check exist account
        let isLoginSuccess = userLogin(user.username, user.password);
        if( !isLoginSuccess ){
            return socket.emit('IOS_LoginResult', ({isSuccess: false, message: 'Wrong username or password!'}));
        }

        // Check if user is onlline
        let isOnlline = checkUserOnlline(user.username);
        if( isOnlline ){
            return socket.emit('IOS_LoginResult', ({isSuccess: false, message:'User is being onlline!'}));
        }

        // Save user
        let listOnllineUsers = storeUser( user );

        // Return user lists
        io.emit('IOS_UsersOnllineList', listOnllineUsers);

        // Return join message
        io.emit('IOS_Message', formatMessage(BotName, null , `<b>${user.dname}</b> joined</b>`)); 
        
        // Save peerId
        socket.peerId = user.peerId;

        // Return login success
        socket.emit('IOS_LoginResult', ({isSuccess: true, message:'Login success!', user}));
    });

    socket.on('IOC_Message', (message) => {
        // get current User
        let currentUser = getCurrentUser(socket.peerId);

        // Return quit message
        if( currentUser ){
            io.emit('IOS_Message', formatMessage(currentUser.dname, currentUser.username, message));
        }
        
    })

    // Mất kết nối
    socket.on('disconnect', () => {
        // get current User
        let currentUser = getCurrentUser(socket.peerId);

        if( currentUser ){
            // Chat 
            io.emit('IOS_Message', formatMessage(BotName, null , `<b>${currentUser.dname}</b> left</b>`));  

            // Stream
            io.emit('IOS_UserDisconnect', currentUser.peerId);

            // remove user
            userLeave(currentUser.peerId);
        }

    });
});

// Config port
const PORT = process.env.PORT || 3000;
server.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



