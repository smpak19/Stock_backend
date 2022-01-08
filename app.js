const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    pass: String,
    saveDate: {
        type: Date,
        defualt: Date.now,
    },
})

const User = mongoose.model("User", UserSchema)

const io = require('socket.io')(server)

app.get('/', (req, res) => {
    res.send('Hello! Kvpn server')
  });

io.sockets.on('connection', (socket) => {
    console.log('Socket connected : ${socket.id}')

    socket.on('disconnect', () => {
        console.log('Socket disconnected : ${socket.id}')
    })

    socket.on('signin', (data) => {
        const userData = JSON.parse(data)
        const id = userData.id
        const pwd = userData.pwd

        const newUser = new User({
            name: id,
            pass: pwd,
        })

        newUser.save().then(() => {console.log(newUser)}).catch((err) => {
            console.log("Error: " + err)
        })

        console.log(`[Username : ${id}] entered [room number : ${pwd}]`)
    })

    socket.on('login', (data) => {
        const userData = JSON.parse(data)
        const id = userData.id
        const pwd = userData.pwd

        User.find({'name':id, 'pass':pwd}).then((result) => {
            if(result.length == 0) {
                socket.emit('login_false', )
                console.log('login failed.')
            } else {
                socket.emit('login_true', )
                console.log('login complete')
            }
        })
        .catch((err) => {
            console.log(err)
        })
    })
})

mongoose.connect('mongodb+srv://jinnam:1130@cluster0.kxooq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    
})
.then(() => {
    console.log("connected to mongoDB");
})
.catch((err) => {
    console.log(err);
});


server.listen(80, () => {
    console.log('Server listening at port 80')
})