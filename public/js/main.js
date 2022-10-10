// Lấy tham số từ URL
const{ username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});


const socket = io();

// user vào phòng
socket.emit('userJoinRoom', { username, room });

// Lấy thông tin phòng và các users trong cùng phòng với mình
socket.on('roomUsers', ( {room, users} ) => {
    // hiện thị số phòng
    document.getElementById('room-name').innerHTML = room;

    // hiển thị danh sách users cùng phòng
    document.getElementById('users').innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
})

// Chat form
const chatForm = document.getElementById("chat-form");
// Form messages
const formMessage = document.querySelector(".chat-messages")

// Chat form submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputMessage = e.target.elements.msg.value;
    // Gửi tin nhắn lên server
    socket.emit('chatMessage', inputMessage);
    // Xóa tin nhắn ở ô input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

// Nhận tin nhắn từ server
socket.on('serverMessage', (msgObj) => {

    const divElement = document.createElement('div');
    divElement.classList.add('message');

    divElement.innerHTML = `
        <p class="meta">${msgObj.user} <span>${msgObj.time}</span></p>
        <p class="text">${msgObj.msgContent}</p>
    `;

    formMessage.appendChild(divElement);
});


// Rời phòng
document.getElementById('leave-btn').addEventListener('click', () => {
    
    const leaveRoom = confirm('Bạn có muốn rời phòng không');

    if(leaveRoom){
        window.location = '../index.html';
    }

});