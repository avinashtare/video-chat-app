import express from "express";
import http from "http";
import { Server } from "socket.io"; // Import Server from 'socket.io'
import { v4 as uuid } from "uuid";

const app = express(); // express app
const server = http.createServer(app); // http server
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100 MB
}); // Create a Socket.io server instance

// set the view engine to ejs
app.set('view engine', 'ejs');
// public directory
app.use(express.static("public"))
// port
const port = process.env.PORT || 3000;


app.get("/", (req, res) => {
    let uid = uuid()
    res.redirect(`room/${uid}`)
})
app.get("/room/*", (req, res) => {
    let uid = uuid()
    res.render("room")
})

server.listen(port, function () {
    console.log(`Listening on port ${port}`);
});


// socket io 
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('isAvailable', (path) => {
        socket.broadcast.emit("isThare", path)
    });

    socket.on("offer",(offer)=>{
        socket.broadcast.emit("getOffer", offer)
    })
    socket.on("answer",(answer)=>{
        socket.broadcast.emit("getAnswer", answer)
    })


    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});