const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    username: {type: String, trim: true, lowercase: true, unique: true, required: true},
    password: {type: String, unique: false, required: true},
    email: {type: String, lowercase:true, unique:true, required:true},
    role: {type: String, default: 'user'}
});
//New model
let User = new mongoose.model('User', userSchema);

module.exports = {
    User: User
}