const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    sender:{
        type:String
    },
    senderId:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    receiver:{
        type:String
    },
    receiverId:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    date:{
        type:Date,
        default:Date.now
    },
    messages:[
        {
            senderMessage:{
                type:String
            },
            sender:{
                type:String
            },
            senderId:{
                type:Schema.Types.ObjectId,
                ref:'User'
            },
            receiverMessage:{
                type:String
            },
            receiverId:{
                type:Schema.Types.ObjectId,
                ref:'User'
            },
            receiverId:{
                type:Schema.Types.ObjectId,
                ref:'User'
            },
            receiver:{
                type:String
            },
            date:{
                type:Date,
                default:Date.now
            }
        }
    ]
})
module.exports = mongoose.model('Chat',chatSchema);