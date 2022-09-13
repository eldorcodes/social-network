module.exports = {
    requireLogin:(req,res,next) => {
        if (req.isAuthenticated()) {
            return next()
        } else {
            return res.redirect('/');
        }
    },
    ensureGuest:(req,res,next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/profile')
        }else{
            return next()
        }
    }
}