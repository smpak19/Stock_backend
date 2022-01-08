const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)

const io = require('socket.io')(server)

app.get('/', (req, res) => {
    res.send('Hello! Kvpn server')
  });

io.sockets.on('connection', (socket) => {
    console.log('Socket connected : ${socket.id}')

    socket.on('disconnect', () => {
        console.log('Socket disconnected : ${socket.id}')
    })
})


server.listen(80, () => {
    console.log('Server listening at http://localhost:3000')
})