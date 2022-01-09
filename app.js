const express = require('express')
const http = require('http')
const { constants } = require('http2')
const app = express()
const server = http.createServer(app)
const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    pass: String,
    account: Number,
    trk: [{
        coinName: String,
        trade: Number,
        amount: Number,
    }],
    saveDate: {
        type: Date,
        defualt: Date.now,
    },
})

const User = mongoose.model("User", UserSchema, 'UserInfo')

const io = require('socket.io')(server)

app.get('/', (req, res) => {
    res.send('Hello! Kvpn server')
  });

io.sockets.on('connection', (socket) => {
    console.log(`Socket connected : ${socket.id}`)

    socket.on('disconnect', () => {
        console.log(`Socket disconnected : ${socket.id}`)
    })

    socket.on('signin', (data) => {
        const userData = JSON.parse(data)
        const id = userData.id
        const pwd = userData.pwd
        
        User.find({'name': id}).then((result) => {
            if(result.length == 0) {
                socket.emit('sign_in_success')
                const newUser = new User({
                    name: id,
                    pass: pwd,
                    account: 100000000,
                })
        
                newUser.save().then(() => {console.log(newUser)}).catch((err) => {
                    console.log("Error: " + err)
                })        
            } else {
                socket.emit('duplicate_id',)
                console.log("Duplicate Id detect")
            }
        })
    })

    socket.on('kakao_signin', (data) => {
        const userData = JSON.parse(data)
        const id = userData.id
        const pwd = userData.pwd
        
        User.find({'name': id}).then((result) => {
            if(result.length == 0) {
                socket.emit('kakao_sign')
                const newUser = new User({
                    name: id,
                    pass: pwd,
                    account: 100000000,
                })
        
                newUser.save().then(() => {console.log(newUser)}).catch((err) => {
                    console.log("Error: " + err)
                })        
            } else {
                socket.emit('kakao_true', )
                console.log('login complete')
            }
        })
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

    socket.on('get_account', (user_id) => {
        User.findOne({'name':user_id}).exec(function(err, user) {
            const account = user.account
            console.log(`get account from ${user.account}`)
            socket.emit('give_account', account)
        })
    })

    socket.on('buy', (data) => {
        const coinData = JSON.parse(data)
        const userid = coinData.userid
        const coinname = coinData.coinname
        const amount = coinData.amount
        const price = coinData.price

        User.findOne({'name': userid}).then(doc => User.updateOne({_id: doc._id}, {$inc: {'account': -price}})).
        then(() => User.findOne({'name': userid})).then(doc => User.updateOne({_id: doc._id},{$push: {trk: {'coinName': coinname, 'trade': price, 'amount': price}}}))
        console.log(`buy complete with ${userid} : ${coinname} amount ${amount} total price ${price}`) 
        socket.emit('buy_success',)
    
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