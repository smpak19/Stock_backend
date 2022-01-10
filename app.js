const { query } = require('express')
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
    current: Number,
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
                    account: 500000000,
                    current: 500000000,
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
                    account: 500000000,
                    current: 500000000,
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
            socket.emit('give_account', account)
        })
    })

    socket.on('buy', (data) => {
        const coinData = JSON.parse(data)
        const userid = coinData.userid
        const coinname = coinData.coinname
        const amount = coinData.amount
        const price = coinData.price

        //잔고 업데이트
        User.findOne({'name': userid}).then(doc => User.updateOne({_id: doc._id}, {$inc: {'account': -price}}))

        //코인 리스트 업데이트(없을 시 추가, 있을 시 매수평균가 수정)
        /*
        User.findOne({'name': userid}).then(doc => User.updateOne({_id: doc._id},{$push: {trk: {'coinName': coinname, 'trade': price, 'amount': amount}}}))
        */

        User.findOne({'name': userid}).then( async (doc) => {
            if(doc.trk.some(item => item.coinName == coinname)) {
                await User.updateOne({_id: doc._id, 'trk.coinName': coinname}, {$inc: {'trk.$.amount': amount, 'trk.$.trade': price}})
            } else {
                await User.updateOne({_id: doc._id},{$push: {trk: {'coinName': coinname, 'trade': price, 'amount': amount}}})
            }
        })
    
        console.log(`buy complete with ${userid} : ${coinname} amount ${amount} total price ${price}`) 
        socket.emit('buy_success',)
    
    })

    socket.on('get_amount', (data) => {
        const Data = JSON.parse(data)
        const userid = Data.userid
        const ticker = Data.ticker
        
        User.findOne({'name': userid}).exec(function(err, doc) {
            var cnt = 0
            for (var i = 0; i < doc.trk.length; i++ ) {
                if(doc.trk[i].coinName == ticker) {
                    socket.emit('set_amount', doc.trk[i].amount)
                    cnt += 1
                }
            }
            if(cnt == 0) {
                socket.emit('set_amount', 0.0)
            }
        })
    })

    socket.on('sell', (data) => {
        const coinData = JSON.parse(data)
        const userid = coinData.userid
        const coinname = coinData.coinname
        const amount = coinData.amount
        const price = coinData.price

        //잔고 업데이트
        User.findOne({'name': userid}).then(doc => User.updateOne({_id: doc._id}, {$inc: {'account': price}}))
        
        User.findOne({'name': userid}).then( async (doc) => {
           await User.updateOne({_id: doc._id, 'trk.coinName': coinname}, {$inc: {'trk.$.amount': -amount, 'trk.$.trade': -price}})
        })
 
        console.log(`sell complete with ${userid} : ${coinname} amount ${amount} total price ${price}`) 
        return socket.emit('sell_success',)
    
    })

    socket.on('merge', (userid) => {
        User.findOne({'name':userid}).then((doc) => {
            User.updateOne({_id:doc._id}, {$pull: {'trk': {'amount': {$eq: 0}}}})
        })
    })

    socket.on('get_total', (user_id) => {
        User.findOne({'name': user_id}).exec(function(err, doc) {
            var total = 0
            for (var i = 0; i < doc.trk.length; i++ ) {
                total += doc.trk[i].trade
            }
            socket.emit('give_maesu', total)
        })
    })

    socket.on('array', (user_id) => {
        User.findOne({'name': user_id}).exec(function(err, doc) {
            var arr = []
            for (var item of ["BTC", "LINK", "ETH", "XRP", "SAND", "DOGE", "BORA", "BTT", "ADA", "EOS"]) {
                var tick = false
                for (var i = 0; i < doc.trk.length; i++ ) {
                    if(doc.trk[i].coinName == item) {
                        arr.push(doc.trk[i].amount)
                        tick = true
                        break
                    }
                }
                if(!tick) {
                    arr.push(0.0)
                }
            }
            socket.emit('arrayget', arr)
        })

        
    })

    socket.on('list', (user_id) => {
        User.findOne({'name': user_id}).exec(function(err, doc) {
            var arr = []
            for (var item of ["BTC", "LINK", "ETH", "XRP", "SAND", "DOGE", "BORA", "BTT", "ADA", "EOS"]) {
                var tick = false
                for (var i = 0; i < doc.trk.length; i++ ) {
                    if(doc.trk[i].coinName == item) {
                        arr.push(doc.trk[i].trade)
                        tick = true
                        break
                    }
                }
                if(!tick) {
                    arr.push(0.0)
                }
            }
            socket.emit('listget', arr)
        })

        
    })

    // Fragment 3 : Get user_id and ranking info
    socket.on('set_current', async (data) => {
        const Data = JSON.parse(data)
        const id = Data.userid
        const cur = Data.current
        await User.findOneAndUpdate({'name': id}, {$set: {current: cur}})
    })

    socket.on('get_current', () => {
        User.find({}, {name: 1, current:1, _id:0}).sort([['current', -1]]).exec((err, data) => {
            socket.emit('here', data)
        })
    })
    

    // Fragment 4 : 1) delete account 2) asset reset 3) change pwd
    socket.on('delete_account', (user_id) => {
        User.deleteOne({'name': user_id}).exec((err, doc) => {
            socket.emit('delete_complete')
        })
    })

    socket.on('reset', (user_id) => {
        User.findOne({'name': user_id}).then( async (doc) => {
            await User.updateOne({_id: doc._id}, {$set: {'account': 500000000, 'trk' : []}})
        })
    })

    // Should we implement requirement of current pwd? .. later
    socket.on('change_pwd', (data) => {
        const pwdData = JSON.parse(data)
        const userid = pwdData.userid
        const current = pwdData.current
        const newpwd = pwdData.newp
        User.findOne({'name': userid}).then(async (doc) => {
            if(doc.pass == current) {
                await User.updateOne({_id: doc._id}, {$set: {'pass': newpwd}})
                socket.emit('change_complete')
            } else {
                socket.emit('wrong_pass')
            } 
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