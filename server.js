const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
// load passport middleware
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');


// load config keys
const keys = require('./config/keys');
// load models
const User = require('./models/User');
const Chat = require('./models/Chat');
const Post = require('./models/Post');
// load helpers
const { requireLogin, ensureGuest } = require('./helpers/Auth');
const port = process.env.PORT || 3000;
// serve static files, such as html, css, js
app.use(express.static('public'));
// parse incoming req object
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Make user local
app.use((req,res,next) => {
    res.locals.user = req.user || null;
    next()
})
// Setup middleware
app.use(cors())
app.use(cookieParser());
app.use(session({
    secret:'mysecret',
    resave:true,
    saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());

// link to passport
require('./passport/local');

// connect to mongodb
mongoose.connect(keys.MONGO_DB_URI)
.then(() => {
    console.log('Connected to MongoDB database..')
})
.catch(e => console.log(e))
// view engine middleware
app.engine('handlebars', engine({
    handlebars:allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');


// SOCKET CONNECTION STARTS HERE
io.on('connection',function(socket){
    /////////////////////////////SOCKET STARTS HERE////////
    console.log('Client is connected.');
    ///// FIND CHAT MESSAGES AND EMIT
Chat.find({})
.then((chats) => {
    socket.broadcast.emit('messages',chats);
    socket.emit('messages',chats);
}).catch(e => console.log(e))
////////////////////////////////
    // listen disconnect event
    socket.on('disconnect',function(){
        console.log('Client has been disconnected.');
        // listen to event and response
    });
    /// FIND ALL USERS FROM MONGODB
    User.find({})
    .then((users) => {
        console.log(users)
        socket.emit('allUsers',users)
    })
    .catch(e => console.log(e))

    // listen to event and response
    socket.on('currentUser',function(id){
       if (id) {
        console.log(id)
        User.findById({_id:id.userID})
        .then((user) => {
            socket.emit('loggedUser',user)
        }).catch(e => console.log(e))
       } else {
           console.log('User logged out, so we were unable to find userID')
       }
    })



////////chat room users event
socket.on('chatRoomUsers',(res) => {
    console.log(res)
    User.findById({_id:res.otherUserId})
    .then((otherUser) => {
        socket.emit('ChatRoomUsersRes',{otherUser})
    }).catch((e) => console.log(e))
})
    // listen to newMessage event
    socket.on('newMessage',function(message){
        console.log(message)
        Chat.findOne({senderId:message.currentUserId,receiverId:message.otherUserId})
        .then((chat) => {
            if (chat) {
                chat.messages.push({
                    senderMessage:message.message,
                    receiverMessage:'',
                    senderId:chat.senderId,
                    receiverId:chat.receiverId,
                    sender:chat.sender,
                    receiver:chat.receiver,
                    date:new Date()
                })
                chat.save((err,chat) => {
                    if (err) {
                        throw err
                    }
                    if (chat) {
                        Chat.find({})
                        .then((chats) => {
                            socket.broadcast.emit('messages',chats);
                            socket.emit('messages',chats);
                        }).catch(e => console.log(e))
                    }
                })
            }else{
                Chat.findOne({senderId:message.otherUserId,receiverId:message.currentUserId})
                .then((chat) => {
                    chat.messages.push({
                        senderMessage:'',
                        receiverMessage:message.message,
                        sender:chat.sender,
                        receiver:chat.receiver,
                        senderId:chat.senderId,
                        receiverId:chat.receiverId,
                        date:new Date()
                    })
                    chat.save((err,chat) => {
                        if (err) {
                            throw err
                        }
                        if (chat) {
                            Chat.find({})
                            .then((chats) => {
                                socket.broadcast.emit('messages',chats);
                                socket.emit('messages',chats);
                            }).catch(e => console.log(e))
                        }
                    })
                })
            }
        })
    })
    ///// CREATE A POST
    socket.on('newPost',(post) => {
        console.log(post)
        User.findById({_id:post.currentUserId})
        .then((user) => {
            console.log(user)
            new Post({
                username:user.username,
                body:post.postInput,
                date:new Date(),
                comments:[],
                likes:[]
            }).save((err,post) => {
                if (err) {
                    console.log(err.message)
                }
                if (post) {
                    console.log('POST SAVED INTO MONGODB')
                    console.log(post)
                    Post.find({})
                    .then((posts) => {
                        socket.broadcast.emit('posts',posts)
                        socket.emit('posts',posts)
                    }).catch(e => console.log(e))
                }
            })
        })
        .catch(e => console.log(e.message))
    })

    /// emit all posts
    Post.find({})
    .then((posts) => {
        socket.broadcast.emit('posts',posts)
        socket.emit('posts',posts)
    }).catch(e => console.log(e))

    // listen to new comment event
    socket.on('newComment',function(comment){
        console.log(comment)
        User.findById(comment.commentUserId)
        .then((user) => {
            Post.findById(comment.postId)
            .then((post) => {
                let newComment = {
                    user:comment.commentUserId,
                    username:user.username,
                    body:comment.body,
                    date:new Date().toString()
                }
                post.comments.push(newComment)
                post.save((err,post) => {
                    if (err) {
                        console.log(err)
                    }
                    if (post) {
                        console.log('Post comment has been saved..')
                        socket.broadcast.emit('postComments',post);
                        socket.emit('postComments',post);
                    }
                })
            })
        })
    })
    // listen to post event
    socket.on('findThisPost',function(id){
        Post.findById(id)
        .then((post) => {
            socket.broadcast.emit('postComments',post);
            socket.emit('postComments',post);
        }).catch(e => console.log(e))
    })

    // listen to addLike event
    socket.on('addLike',function(data) {
        console.log('POST DATA TO ADD LIKE --- ',data);
        User.findById(data.userID)
        .then((user) => {
            console.log('USER FOUND --- ', user);
            Post.findById(data.postId)
            .then(post => {
                post.likes.push(user)
                post.save((err,updatedPost) => {
                    if (err) {
                        console.log(err)
                    }
                    if (updatedPost) {
                        console.log('UPDATED POST ---- ',updatedPost);
                        Post.find({})
                        .then((posts) => {
                            // emit updated posts
                            socket.broadcast.emit('posts',posts)
                            socket.emit('posts',posts)
                        }).catch(e => console.log(e))
                    }
                })
            })
            .catch(e => console.log(e))
        })
        .catch(e => console.log(e))
    })

    // REMOVE LIKE
    socket.on('removeLike',function(data){
        console.log('REMOVED ...');
        Post.findById(data.postId)
        .then((post) => {
                User.findById(data.userID)
                .then((user) => {
                    post.likes.shift(user)
               post.save()
               .then(() => {
                Post.find({})
                    .then((posts) => {
                        // emit updated posts
                        socket.broadcast.emit('posts',posts)
                        socket.emit('posts',posts)
                    }).catch(e => console.log(e))
               }).catch(e => console.log(e))
                }).catch(e => console.log(e.message))
        }).catch(e => console.log(e))
    })
    /////////////////SOCKET ENDS HERE//////////////////
});


app.get('/',ensureGuest, (req, res) => {
    res.render('home');
});

app.get('/signup',ensureGuest,(req,res) => {
    res.render('Authentication/Signup');
});

app.get('/forgotPassword',ensureGuest,(req,res) => {
    res.render('Authentication/ForgotPassword');
});
// handle signup post request
app.post('/signup',(req,res) => {
   User.findOne({email:req.body.email})
   .then((user) => {
       if (user) {
           ///// account exists with email
           res.render('Authentication/Signup',{
            errorMessage:'Email is already in use'
        })
       }else{
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
    
        let newUser = {
            username:req.body.username,
            email:req.body.email,
            password:hash,
            date:new Date(),
            online:true
        }
        new User(newUser)
        .save((error) => {
            if (error) {
                throw error
            }
            res.render('home',{
                success:'Account has been created. You can login now.'
            })
        })
       }
   })
})
// handle /login request
app.post('/login',passport.authenticate('local',{
    failureRedirect:'/error'
}),(req,res) => {
    User.findByIdAndUpdate({_id:req.user._id},{online:true})
    .then(() => {
        res.redirect('/profile')
    }).catch(e => console.log(e))
})
// handle redirect to profile route
app.get('/profile',requireLogin,(req,res) => {

    User.findById({_id:req.user._id})
    .then((loggedUser) => {
        console.log(loggedUser)
        res.render('Authentication/Profile',
        {
            loggedUser:loggedUser,
            title:'Profile'
        });
    }).catch(e => console.log(e))
});
app.get('/error',function(req,res){
    res.render('home',{errorMessage:'Email or Password incorrect'})
})
// handle logout route
app.get('/logout',function(req,res){
    User.findByIdAndUpdate(req.user._id,{online:false},function(err){
        if (err) {
            throw err.message
        }
        req.logOut(function(err){
            if (err) {
                throw err.message
            }
            res.redirect('/')
        })
    })
});
app.get('/users',requireLogin,(req,res) => {
    User.find({})
    .then((users) => {
        res.render('Users/users',{
            users,
            title:'Users'
        })
    })
})
app.get('/userProfile/:id',requireLogin,(req,res) => {
    console.log(req.params.id)
    User.findOne({_id:req.params.id})
    .then((userData) => {
        console.log(userData)
        res.render('Users/UserProfile',{userData,title:'Profile'})
    }).catch(e => console.log(e))
})
////////////START NEW CHAT PROCESS//////////////////////
app.get('/chatRoom/:id',(req,res) => {
   Chat.findOne({
       senderId:req.user._id,
       receiverId:req.params.id
   }).then((chat) => {
       if (chat) {
           User.findById({_id:req.params.id})
           .then((otherUser) => {
               User.findById({_id:req.user._id})
               .then((currentUser) => {
                res.render('ChatRoom',{
                    otherUser,
                    chat,
                    currentUserId:req.user._id,
                    title:'Chat Room',
                    currentUser
                })
               }).catch(e => console.log(e.message))
           }).catch(e => console.log(e.message))
       }else{
           Chat.findOne({
               senderId:req.params.id,
               receiverId:req.user._id
           }).then((chat) => {
               if (chat) {
                   User.findById({
                       _id:req.params.id
                   }).then((otherUser) => {
                    User.findById({_id:req.user._id})
                    .then((currentUser) => {
                     res.render('ChatRoom',{
                         otherUser,
                         chat,
                         currentUserId:req.user._id,
                         title:'Chat Room',
                         currentUser
                     })
                    }).catch(e => console.log(e.message))
                   }).catch(e => console.log(e.message))
               }else{
                   /// create new chat /////
                   User.findById({
                       _id:req.user._id
                   }).then((currentUser) => {
                       User.findById({
                           _id:req.params.id
                       }).then((otherUser) => {
                           new Chat({
                               sender:currentUser.username,
                               senderId:currentUser._id,
                               receiver:otherUser.username,
                               receiverId:otherUser._id,
                               date:new Date() 
                           }).save((err,chat) => {
                               if (err) {
                                   throw err
                               }
                               if (chat) {
                                User.findById({_id:req.user._id})
                                .then((currentUser) => {
                                 res.render('ChatRoom',{
                                     otherUser,
                                     chat,
                                     currentUserId:req.user._id,
                                     title:'Chat Room',
                                     currentUser
                                 })
                                }).catch(e => console.log(e.message))
                               }
                           })
                       }).catch(e => console.log(e))
                   }).catch(e => console.log(e))
               }
           }).catch(e => console.log(e))
       }
   }).catch(e => console.log(e))
});
//////////////////////////////END OF CHAT PROCESS////////////////////////

app.get('/posts',(req,res) => {
    User.findById({_id:req.user._id})
    .then((currentUser) => {
        res.render('Posts/Posts',{
            currentUser
        })
    }).catch(e => console.log(e.message))
})
app.get('/comments/:id',(req,res) => {
    Post.findById(req.params.id)
    .then((post) => {
        res.render('Posts/Comments',{
            post,
            currentUserId:req.user._id
        })
    }).catch(e => console.log(e))
})
// UPDATE PASSWORD
app.post('/updatePassword',(req,res) => {
    console.log(req.body)
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);

    User.findOneAndUpdate({email:req.body.email},{password:hash})
    .then((user) => {
        res.render('Authentication/ForgotPassword',{
            success:'Update successful. You can login with new password'
        })
    }).catch((e) => {
        res.render('Authentication/ForgotPassword',{
            error:e.message
        })
    })
})
// listen to port
server.listen(port,function(error){
    if (error) {
        throw error
    }
    console.log(`Server started on port ${port}`);
});