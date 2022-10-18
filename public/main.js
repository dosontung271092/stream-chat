// *** WEB START ***

const socket = io();
let _username;
let _peerId;

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
function displayStreamChat(user){
    document.getElementById('login-block').style.display = 'none';
    document.getElementById('chat-block').style.display = 'block';
    document.getElementById('cover-loader').style.display = "none";

    // Display account info
    if( user ){
        document.getElementById("local-dname").innerHTML = user.dname;
        document.getElementById('header-username').innerHTML = user.dname;
        document.getElementById("local-stream").parentElement.querySelector('.show-map').setAttribute("onclick", `showMapLocation(${user.latitude}, ${user.longitude})`);
    }
}

// By default we display login form
displayLoginForm();

// Get PeerID local for calling video stream
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
    alert("Geolocation is not supported by this browser. Others in the conversation can not see your location!");
}


// *** LOGIN ***

document.getElementById('btn-sign-up').addEventListener('click', e =>{
    // display loader
    document.getElementById('cover-loader').style.display = "flex";

    // Get data
    _peerId = document.getElementById("my-peer-id").value;
    let latitude = document.getElementById("my-latitude").value;
    let longitude = document.getElementById("my-longitude").value;

    _username = document.getElementById('txt-username').value;
    let password = document.getElementById('txt-password').value;
    let nname = document.getElementById('nick-name').value;
    let dname = _username + ' - ' + nname;

    // Validate login form
    if( _username == '' || password == '' || nname == '' ){
        displayLoginForm();
        displayLoginErrorMsg("Please enter data for * fields!");
        return;
    }

    // Send login info to server
    socket.emit('IOC_AcountLogin', {
        username: _username, 
        password: password,
        nname: nname,
        dname: dname,
        peerId: _peerId, 
        latitude: latitude, 
        longitude: longitude
    });

});

socket.on('IOS_LoginResult', ({isSuccess, message, user = {}}) => {
    if( isSuccess ){
        displayStreamChat(user);
    }else{
        displayLoginForm();
        displayLoginErrorMsg(message);
    }
});

// *** VIDEO STREAM ***

let streamMutedBtn = document.getElementById('stream-muted-btn');

streamMutedBtn.addEventListener('click', e => {
    
    isMuted = streamMutedBtn.parentElement.parentElement.querySelector('video').muted;
    
    if( isMuted ){
        e.target.innerHTML = 'Muted';
        streamMutedBtn.parentElement.parentElement.querySelector('video').muted = false;

    }else{
        e.target.innerHTML = 'Unmuted';
        streamMutedBtn.parentElement.parentElement.querySelector('video').muted = true;

    }

});


// Get current users from server
socket.on('IOS_UsersOnllineList', usersOnlline => {

    // Open all stream
    openStream().then(stream => {
        // open stream of myself
        playStream('local-stream', stream);

        // get videos element
        let remoteVideoElements = document.querySelectorAll('.video-grid__item video');

        // Render user onlline remote with video
        let index = 0;
        usersOnlline.forEach(user => {
            if( _peerId !=  user.peerId){
                let remoteVideoElement = remoteVideoElements[index];
                
                // set Id value for remote video element
                remoteVideoElement.id = user.peerId;

                // Render video to grid
                const call = peer.call(user.peerId, stream);

                // Display user info on video
                let parentE = remoteVideoElement.parentElement;
                parentE.querySelector('.remote-dname').innerHTML = user.dname;
                parentE.querySelector('.video__description').style.display = "block";
                parentE.querySelector('.show-map').setAttribute("onclick", `showMapLocation(${user.latitude}, ${user.longitude})`);
                
                // Call to open video of remote user
                call.on('stream', remoteStream => playStream(user.peerId, remoteStream));

                index ++;
            }
        });

    });

    // Disconect
    socket.on('IOS_UserDisconnect', peerId => {
        videoElement = document.getElementById(peerId);
        videoElement.parentElement.querySelector('.video__description').style.display = "none";
        videoElement.parentElement.innerHTML = videoElement.parentElement.innerHTML;
    });

});

// Video config
function openStream(){
    const config = {audio: true, video: true};
    return navigator.mediaDevices.getUserMedia(config);
}

// Open video stream
function playStream(IdElement, stream){
    if( IdElement ){
        const video = document.getElementById(IdElement);
        if(video){
            video.srcObject = stream;
            video.play();
        }
    }
}

// Answer video call
peer.on('call', call => {
    openStream().then( stream => {
        // open stream of caller
        call.answer(stream);
    });
});

const showMapLocation = function (lat, long) {
    const url = 'https://maps.google.com/maps?q=' + lat + ',' + long + '&z=16&output=embed';
    const map = '<iframe src="' + url + '" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    $("#google-map").html(map);
    const modal = new bootstrap.Modal(document.getElementById('map-modal'), {
        keyboard: false
    })
    modal.toggle()
}


// *** CHAT ***

// Form messages
const _chatWindowElement = document.getElementById("chat-window");
const _chatFormElement = document.getElementById("chat-form");

// Receive message from server
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


    _chatWindowElement.appendChild(msgElement);

    _chatWindowElement.scrollTop = _chatWindowElement.scrollHeight;
});

// Chat form submit
_chatFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputMessage = e.target.elements.msg.value;
    if( inputMessage ){
        // Send message to server
        socket.emit('IOC_Message', inputMessage);
        // Clear input value
    }
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

// *** SUPPORT FUNCTIONS ***

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