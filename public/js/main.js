const socket = io();
let _username;

// Display login form
function displayLoginForm(){
    document.getElementById('login-block').style.display = 'block';
    document.getElementById('chat-block').style.display = 'none';
    document.getElementById('cover-loader').style.display = "none";
}

// Display error message of form login
function displayLoginErrorMsg(message){
    document.getElementById('login-error-message').style.display = 'block';
    document.getElementById('login-error-message').innerHTML = message;

    setTimeout(function(){
        $("#login-error-message").fadeOut()
    }, 3000);
}

// Display stream chat
function displayStreamChat(){
    document.getElementById('login-block').style.display = 'none';
    document.getElementById('chat-block').style.display = 'block';
    document.getElementById('cover-loader').style.display = "none";
}

// By default we display login form
displayLoginForm();

// Get PeerID local
var peer = new Peer();
peer.on('open', function(peerId) {
    document.getElementById("my-peer-id").value = peerId;
});

// Get lat long
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( position => {
        document.getElementById("my-latitude").value = position.coords.latitude;
        document.getElementById("my-longitude").value = position.coords.longitude;
    });
} else { 
    alert("Geolocation is not supported by this browser.");
}

// Login
document.getElementById('btn-sign-up').addEventListener('click', e =>{
    // display loader
    document.getElementById('cover-loader').style.display = "flex";

    // Get data
    let peerId = document.getElementById("my-peer-id").value;
    let latitude = document.getElementById("my-latitude").value;
    let longitude = document.getElementById("my-longitude").value;

    _username = document.getElementById('txt-username').value;
    let password = document.getElementById('txt-password').value;
    let nname = document.getElementById('nick-name').value;
    let dname = _username + ' - ' + nname;

    if( _username == '' || password == '' || nname == '' ){
        displayLoginForm();
        displayLoginErrorMsg("Please enter data for * fields!");
        return;
    }

    // Login server
    socket.emit('IOC_AcountLogin', {
        username: _username, 
        password: password,
        nname: nname,
        dname: dname,
        peerId:peerId, 
        latitude: latitude, 
        longitude: longitude
    });



    // Display account info
    document.getElementById("local-dname").innerHTML = dname;
    document.getElementById('header-username').innerHTML = dname;
    document.getElementById("local-stream").parentElement.querySelector('.show-map').setAttribute("onclick", `showMapLocation(${latitude}, ${longitude})`);

});

socket.on('IOS_LoginResult', ({isSuccess, message}) => {
    if( !isSuccess ){
        displayLoginForm();
        displayLoginErrorMsg(message);
    }
});

// End login

// Get current users
socket.on('IOS_UsersOnllineList', ({usersOnlline, user}) =>{
    // Login and open stream success
    displayStreamChat();
    
    let localStreamId = document.getElementById("my-peer-id").value;

    // get videos element
    let remoteVideoElements = document.querySelectorAll('.video-grid__item video');


    // Add id = peerId for video elements
    let index = 0;
    usersOnlline.forEach(user => {
        if( localStreamId !=  user.peerId){
            remoteVideoElements[index].id = "video-" + user.peerId;
            index ++;
        }
    });

    // Open all stream
    openStream().then(stream => {
        // open stream of myself
        playStream('local-stream', stream);

        // call to another user
        usersOnlline.forEach( user => {
            if( localStreamId !=  user.peerId){
                const call = peer.call(user.peerId, stream);
                remoteVideoElement = document.getElementById("video-" + user.peerId);
                remoteVideoElement.parentElement.querySelector('.remote-dname').innerHTML = user.dname;
                remoteVideoElement.parentElement.querySelector('.time').style.display = "block";
                remoteVideoElement.parentElement.querySelector('.show-map').setAttribute("onclick", `showMapLocation(${user.latitude}, ${user.longitude})`);
                call.on('stream', remoteStream => playStream("video-" + user.peerId, remoteStream));
            }
        });

    });

    // Disconect
    socket.on('IOS_UserDisconnect', peerId => {
        videoElement = document.getElementById("video-" + peerId);
        videoElement.parentElement.querySelector('.remote-dname').innerHTML = 'Name';
        videoElement.parentElement.innerHTML = videoElement.parentElement.innerHTML;
    });

});

// Video config
function openStream(){
    const config = {audio: true, video: true};
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(IdElement, stream){
    if( IdElement != null ){
        const video = document.getElementById(IdElement);
        video.srcObject = stream;
        video.play();
    }
}

// Answer video call
peer.on('call', call => {
    openStream().then( stream => {
        // open stream of caller
        call.answer(stream);
    });
});

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}


const showMapLocation = function (lat, long) {
    const url = 'https://maps.google.com/maps?q=' + lat + ',' + long + '&z=16&output=embed';
    const map = '<iframe src="' + url + '" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    $("#google-map").html(map);
    const modal = new bootstrap.Modal(document.getElementById('map-modal'), {
        keyboard: false
    })
    modal.toggle()
}


// Chat


// Form messages
const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");

// Nhận tin nhắn từ server
socket.on('IOS_Message', (msgObj) => {

    const msgElement = document.createElement('article');
    msgElement.classList.add( 'msg-container' );
    msgElement.classList.add( msgObj.username == _username ? 'msg-self' : 'msg-remote' );
    msgElement.innerHTML =  `<div class="msg-box">
                                    <div class="flr">
                                        <div class="messages">
                                            <p class="msg">
                                                ${msgObj.msgContent}
                                            </p>
                                        </div>
                                        <span class="timestamp"><span class="username">${msgObj.dname}</span>&bull;<span class="posttime">${msgObj.time}</span></span>
                                    </div>
                             </div>`


    chatWindow.appendChild(msgElement);

    chatWindow.scrollTop = chatWindow.scrollHeight;
});

// Chat form submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputMessage = e.target.elements.msg.value;
    // Gửi tin nhắn lên server
    socket.emit('IOC_Message', inputMessage);
    // Xóa tin nhắn ở ô input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

