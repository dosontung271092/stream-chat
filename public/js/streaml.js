const socket = io();

document.getElementById('div-chat').style.display = "none";

socket.on('DANH_SACH_ONLINE', arrUserInfo =>{
    let html = '';

    arrUserInfo.forEach( user => {
        const {username, peerId } = user;
        html += `<li id="${peerId}">${username}</li>`;

    });

    document.getElementById('ulUser').innerHTML = html;

    document.getElementById('div-chat').style.display = "block";
    document.getElementById('div-dang-ky').style.display = "none";

    socket.on('AI_DO_NGAT_KET_NOI', peerId => {
        document.getElementById(peerId).remove();
    });

    const userLis = document.querySelectorAll('#ulUser li');
    userLis.forEach( userLi => {
        userLi.addEventListener('click', e => {
            remoteId = e.target.getAttribute('id');

            openStream().then(stream => {
                // open stream of myself
                playStream('localStream', stream);
        
                // call to another user
                const call = peer.call(remoteId, stream);
                call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
            });
            
        });
    });


});

socket.on('DANG_KY_THAT_BAI', () => alert('Vui lòng chọn user khác!'));


// lấy video
function openStream(){
    const config = {audio: false, video: true};
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(idVideoTag, stream){
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}

// openStream().then( stream => playStream('localStream', stream) );

var peer = new Peer();
peer.on('open', function(id) {
    document.getElementById("my-peer").innerHTML = id;

    // Sign up
    document.getElementById("btnSignUp").addEventListener('click', () => {
        
        const username = document.getElementById("txtUsername").value;
        socket.emit('NGUOI_DUNG_DANG_KY', {username: username, peerId: id});


    });

});

// Caller
document.getElementById("btnCall").addEventListener('click', () => {
    const remoteId = document.getElementById("remoteId").value;
    openStream().then(stream => {
        // open stream of myself
        playStream('localStream', stream);

        // call to another user
        const call = peer.call(remoteId, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});

// Receiver
peer.on('call', call => {
    openStream().then( stream => {
        // open stream of caller
        call.answer(stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));

        // open stream of myself
        playStream('localStream', stream);
    });
});



