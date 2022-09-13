const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    username:{
        type: String
    },
    body:{
        type: String
    },
    comments: [],
    likes:[],
    date:{
        type: Date,
        default:Date.now
    }
})

module.exports = mongoose.model('Post',postSchema);