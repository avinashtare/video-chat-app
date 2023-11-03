const socket = io();
let peerConnection;
let dataChannel;
let localStream;
let remoteStream;

socket.emit("connected","ok")

let servers = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}
let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("user-1").srcObject = localStream;
}
init()

let createOffer = async (e) => {
    peerConnection = new RTCPeerConnection(servers);


    // remote track
    remoteStream = new MediaStream()
    document.getElementById("user-2").srcObject = remoteStream;

    // set my tracks to the user
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    })

    // reciveing tarcks
    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    // channel
    dataChannel = peerConnection.createDataChannel("Chatting App");
    dataChannel.onopen = ((e) => {
        console.log("User Connected....")
    })

    // message comming
    dataChannel.onmessage = ((e) => {
        // console.log("Msg: ", e.data)
        setMsg(e.data, "o")
    })

    dataChannel.onclose = ((e) => {
        console.log("Closed: ", e)
    })

    peerConnection.onicecandidate = (e) => {
        // console.log("Candidate Key: ",JSON.stringify(peerConnection.localDescription))
        document.getElementById("new-offer").value = JSON.stringify(peerConnection.localDescription);
    }

    let offer = await peerConnection.createOffer()

    peerConnection.setLocalDescription(offer)
}

// reciver create offer and create answer
let createAnswer = async () => {
    peerConnection = new RTCPeerConnection(servers);

    // remote track
    remoteStream = new MediaStream()
    document.getElementById("user-2").srcObject = remoteStream;

    // set my tracks to the user
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    })

    // reciveing tarcks
    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    let offer = document.getElementById("new-offer").value;
    offer = JSON.parse(offer)

    await peerConnection.setRemoteDescription(offer);

    peerConnection.onicecandidate = (e) => {
        document.getElementById("new-answer").value = JSON.stringify(peerConnection.localDescription)
    }

    peerConnection.ondatachannel = (e) => {
        dataChannel = e.channel;
        dataChannel.onopen = ((e) => {
            console.log("User Connected....")
        })

        dataChannel.onmessage = ((e) => {
            // console.log("Msg: ", e.data)
            setMsg(e.data, "o")
        })

        dataChannel.onclose = ((e) => {
            console.log("Closed: ", e)
        })
    }


    let answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);
}

let addAnswer = () => {
    let answer = document.getElementById("get-answer").value;
    answer = JSON.parse(answer)
    peerConnection.setRemoteDescription(answer);
}

// sned msg
function setMsg(msg, type) {
    if (type == "i") {
        document.getElementById("logs").innerHTML += `<div class="incoming">
        <div class="msg">${msg}</div>
      </div>`;
    }
    else {
        document.getElementById("logs").innerHTML += `<div class="outgoing">
        <div class="msg">${msg}</div>
      </div>`;
    }
    document.getElementById("chat-box").value = "";
}
let handleSendMsg = () => {
    let msg = document.getElementById("chat-box").value;

    dataChannel.send(msg)
    setMsg(msg, "i")
}

document.getElementById("create-offer").addEventListener("click", createOffer)
document.getElementById("create-answer").addEventListener("click", createAnswer)
document.getElementById("add-answer").addEventListener("click", addAnswer)
document.getElementById("send-msg").addEventListener("click", handleSendMsg)