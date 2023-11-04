const socket = io();
let peerConnection = false;
let dataChannel;
let localStream;
let remoteStream;
let path = new URL(document.URL).pathname;
let offer;
let answer;

path = path.split("/")[2];
socket.emit("isAvailable", path)

socket.on("isThare", async (e) => {
    if (e == path && !peerConnection) {
        createOffer()
    }
})

socket.on("getOffer", async (e) => {
    offer = e
    createAnswer()
})
socket.on("getAnswer", async (e) => {
    answer = (e)
    addAnswer()
})


// servers
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


let userClose = (e) => {
    console.log("Closed: ", e)
    peerConnection = false;
    dataChannel = undefined;
    remoteStream = new MediaStream()
    document.getElementById("user-2").srcObject = remoteStream;
}

let createOffer = async () => {
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
        userClose(e)
    })

    peerConnection.onicecandidate = (e) => {
        // console.log("Candidate Key: ",JSON.stringify(peerConnection.localDescription))
        if (e.candidate) {
            lastCandidate = e.candidate; // Store the last candidate
        } else {
            // ICE gathering is complete, emit the offer or answer
            if (lastCandidate) {
                socket.emit("offer", JSON.stringify(peerConnection.localDescription));
            }
        }
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

    offer = JSON.parse(offer)

    await peerConnection.setRemoteDescription(offer);

    peerConnection.onicecandidate = (e) => {
        if (peerConnection.iceGatheringState === "complete") {
            // ICE gathering is complete, display the final local description
            socket.emit("answer", JSON.stringify(peerConnection.localDescription));
        }
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
            userClose(e)
        })
    }


    let answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);
}

let addAnswer = () => {
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
    if (dataChannel) {
        dataChannel.send(msg)
        setMsg(msg, "i")
    }
    else {
        alert("connect a user for chating")
    }
}

document.addEventListener("keyup", (e) => {
    if (e.key == "Enter" && document.activeElement === document.getElementById("chat-box")) {
        handleSendMsg()
    }
})
document.getElementById("send-msg").addEventListener("click", handleSendMsg)
