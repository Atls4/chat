let jwt = require('jsonwebtoken');
let config = require('./config');

let checkCookie = (req, res, next) => {

    let cookie = req.cookies.JWTtoken; //Cookieparser?
    if (cookie){
        
        console.log('Cookie ' + cookie);
        
    }

    if(cookie){
        jwt.verify(cookie, config.secret, (err, decoded) => {
            if(err){
                return res.json({
                    success: false,
                    message: 'Token not valid'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.redirect('/login');
    }
}

module.exports = {
    checkCookie : checkCookie
}