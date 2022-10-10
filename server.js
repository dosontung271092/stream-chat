const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const {storeUser, getCurrentUser, getRoomUsers, userLeave} = require('./services/users')
const formatMessage = require('./services/messages')

const app = express();
const PORT = 3000;
const BotName = "Bot";

const server = http.createServer(app);
const io = socketio(server);

// chạy khi client kết nối
io.on('connection', socket => {

    // User vào phòng
    socket.on('userJoinRoom', ({username, room}) => {
        socket.join(room);
        
        // Chào user mới vào phòng
        io.to(room).emit('serverMessage', formatMessage(BotName, `Chào mừng <b>${username}</b> vào phòng <b>${room}</b>`));
        storeUser( socket.id, username, room );

        // Gửi thông tin phòng và danh sách tất cả users trong phòng
        io.to(room).emit('roomUsers',{
            room: room,
            users: getRoomUsers(room)
        }); 
    })
   

    // Nhận tin nhắn từ client
    socket.on('chatMessage', (message) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('serverMessage', formatMessage(user.username, message));
    })


    // Chạy khi mà client mất kết nối
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        io.to(user.room).emit('serverMessage', formatMessage(BotName, `<b>${user.username}</b> đã rời phòng`));

        // Gửi thông tin phòng và danh sách tất cả users trong phòng
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        }); 
    });

 


});

server.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, 'public')));