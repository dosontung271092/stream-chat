const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const mysql = require('mysql');
const {storeUser, userLogin, userLeave, isExistUsername} = require('./services/users')
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

        // Login with database
        let querylogin = `SELECT * FROM tblmstaff WHERE StaffID = '${user.username}' AND Password = '${user.password}'`;

        //Connect MySQL
        var con = mysql.createConnection({
          host: "localhost",
          user: "root",
          password: "",
          database: "tblmstaff"
        });

        con.connect(function(err) {
            if (err){
                return socket.emit('IOS_LoginResult', ({isSuccess: false, message: err}));
            };

            con.query(querylogin, function (err, result, fields) {
                
                if (err){
                    return socket.emit('IOS_LoginResult', ({isSuccess: false, message: err}));
                };

                // Db does not exsit user
                if( ! result.length > 0 ){
                    return socket.emit('IOS_LoginResult', ({isSuccess: false, message: 'Wrong username or password!'}));
                }

                const isUserOnlline = isExistUsername(user.username);
                
                if( isUserOnlline ){
                    return socket.emit('IOS_LoginResult', ({isSuccess: false, message:'User is being onlline!'}));
                }

                socket.peerId = user.peerId;
                socket.dname = user.dname;
                socket.username = user.username;

                let usersOnlline = storeUser( user );

                io.emit('IOS_UsersOnllineList', ({usersOnlline, user}));
                io.emit('IOS_Message', formatMessage(BotName, null , `<b>${user.dname}</b> joined</b>`));            
            });
        });
    });

    socket.on('IOC_Message', (message) => {
        io.emit('IOS_Message', formatMessage(socket.dname, socket.username, message));
    })

    // Mất kết nối
    socket.on('disconnect', () => {
        // Chat 
        io.emit('IOS_Message', formatMessage(BotName, null , `<b>${socket.dname}</b> left</b>`));  

        // Stream
        io.emit('IOS_UserDisconnect', socket.peerId);
        
        // remove user
        userLeave(socket.peerId);
    });
});

// Config port
const PORT = 3000;
server.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



