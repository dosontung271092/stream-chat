const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const PORT = 3000;


const arrUserInfo = [];

const server = http.createServer(app);
const io = socketio(server);

server.listen( PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, 'public')));

// chạy khi client kết nối
io.on('connection', socket => {
    socket.on('NGUOI_DUNG_DANG_KY', user => {
        const isUserExist = arrUserInfo.some(u => u.username === user.username);
        if(isUserExist) return socket.emit('DANG_KY_THAT_BAI');
        socket.peerId = user.peerId;
        arrUserInfo.push(user);
        io.emit('DANH_SACH_ONLINE', arrUserInfo);

    });


    socket.on('disconnect', () => {
        const index = arrUserInfo.findIndex(user => user.peerId === socket.peerId);
        arrUserInfo.splice(index, 1);
        io.emit('AI_DO_NGAT_KET_NOI', socket.peerId);
    });
});