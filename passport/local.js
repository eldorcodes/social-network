const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcryptjs = require('bcryptjs');

passport.serializeUser((user,done) => {
    done(null,user.id)
});
passport.deserializeUser((id,done) => {
    User.findById(id,(err,user) => {
        done(err,user)
    })
});

passport.use(new LocalStrategy({
    usernameField:'email',
    passwordField:'password'
}, function(email,password,done){
    User.findOne({email:email},function(err,user){
        if (err) {
           return done(err)
        }
        if (!user) {
            return done(null,false)
        }
        if (user) {
            bcryptjs.compare(password,user.password,(err,match) => {
                if (err) {
                    return done(err)
                }
                if (match) {
                    return done(null,user)
                }else{
                    return done(null,false)
                }
            })
        }
    })
}))