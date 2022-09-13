const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:{
        type:String
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    online:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model('User',userSchema);