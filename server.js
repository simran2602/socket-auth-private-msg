const { Socket } = require('dgram')
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const users = {};

io.on('connection', (socket) => {
    console.log("a user is connected");

    socket.on('setUserName', (userName) => {
        users[socket.id] = userName
        io.emit('userList', Object.values(users))
        console.log(`User set username: ${userName}`);
        console.log(users);
    });

    socket.on('createRoom', (room) => {
        socket.join(room)
        console.log(`room created: ${room}`);
        // console.log("room details: ",io.sockets.adapter.rooms);
        io.emit('roomList', Array.from(io.sockets.adapter.rooms.keys()).filter(room => !users[room]));
    });

    socket.on('joinRoom', (room) => {
        socket.join(room)
        console.log(`User joined room: ${room}`);
    });

    socket.on('leaveRoom', (room) => {
        socket.leave(room)
        console.log(`User leaves room: ${room}`);
    });

    socket.on('chatMessage', (data) => {
        const { room, message } = data;
        io.to(room).emit('chatMessage', { userName: users[socket.id], message })
    });

    socket.on('privateMessage', (data) => {
        const { to, message } = data;
        console.log(data);
        console.log("array of ids",Object.keys(users));
        const recipientSocket = Object.keys(users).find(id => users[id] === to);
        console.log(recipientSocket);
        if (recipientSocket) {
            io.to(recipientSocket).emit('privateMessage', { from: users[socket.id], message })
        }
    });

    socket.on('typing', (data) => {
        const { room, isTyping } = data;
        socket.to(room).emit('typing', { username: users[socket.id], isTyping });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('userList', Object.values(users));
        console.log('user disconnected');
    });

});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});