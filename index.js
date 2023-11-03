import express from "express";
import http from "http";
import { Server } from "socket.io"; // Import Server from 'socket.io'
import { v4 as uuid } from "uuid";
import ejs from "ejs";

const app = express(); // express app
const server = http.createServer(app); // http server
const io = new Server(server); // Create a Socket.io server instance

// set the view engine to ejs
app.set('view engine', 'ejs');
// public directory
app.use(express.static("public"))
// port
const port = process.env.PORT || 8080;


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

    socket.on('connected', (msg) => {
        console.log('message: ' + msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});