//DEPENDENCIES
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();
const http = require('http').Server(app);

const io = require('socket.io')(http);
const chalk = require('chalk');

const config = require('./config');
const middleware = require('./middleware');

const models = require('./models');
let User = models.User;

class HandlerGenerator {
    registerPage (req,res) {
        res.sendFile('register.html', {root: __dirname}, (err) => {
            if(err){
                console.log(err);
                
            } else {
                console.log('Sign in successfully sent');
                
            }
        });
    }

    register (req,res) {
        let username = req.body.username;
        let password = req.body.password;
        let passwordConfirm = req.body.passwordConfirm;
        let email = req.body.email;
        //Check if all forms are filled
        if(username && password && passwordConfirm && email){
            //Check if passwords are the same
            if(password === passwordConfirm){
            //Check if email is unique
            User.findOne({email: email}, (err,result) => {
                if(result == null){
                    //Check if username is unique
                    User.findOne({username: username}, (err,result) => {
                        if(result == null){
                            let member = new User({
                                username: username,
                                email: email, 
                                password: password 
                            });
                            member.save( (err)=>{
                                if(err){
                                    console.log(err);
                                    
                                }else {
                                    console.log('New member ' + username + ' saved!')
                                    res.json({success:true, message: 'New member registered'});
                                }
                            });
                        } else {
                            res.json({success:false, message: 'Username already in use'});
                        }
                    });
                } else {
                    res.json({success:false, message: 'Email already in use'});
                }
            });
            } else {
                res.json({success:false, message: 'Password isn\'t the same'});
            }
        }else{
            res.json({success:false, message: 'Something is missing'});
        }
    }

    loginPage (req,res) {
        res.sendFile('login.html', {root: __dirname}, (err) => {
            if(err){
                console.log(err);
                
            } else {
                console.log('Sign in successfully sent');
                
            }
        });
    }

    login (req, res) {
        let userInfo = {
            username: req.body.username.toLowerCase(),
            password: req.body.password,
            email: req.body.email.toLowerCase()
        };
        /*
        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        */
        validateLogin(User, userInfo, (data)=>{
            if(data.success == true){
            //Send cookie
            res.cookie('JWTtoken', data.token, { maxAge: 900000});
            console.log('Cookie');
            res.redirect('/');

            } else{
                res.json({  
                            success: false, 
                            message: `Something went wrong: ${data.message}`, 
                            error: data.err
                        });
                
            }
        });

    }
    index (req, res) {
        res.sendFile('main.html', {root: __dirname}, (err) => {
            if(err){
                console.log(err);
                
            } else {
                console.log('Sign in successfully sent');
                
            }
        });
    }
}
//------------------------------------------------------------
//Login function
function validateLogin(model, data, callback){
    let response = {

    };
    if(data.username && data.password){

        model.findOne({username: data.username}, (err,doc) => {
            if(err){
                response.success = false;
                response.message = "Username not found"
                response.err = err;
                callback(response);
            } else {
                if(doc.username == data.username && doc.password === data.password){
                    //SIGN TOKEn
                    let token = jwt.sign({ username: data.username}, config.secret); //Modify in future
                    
                    response.success = true;
                    response.message = "Token signed";
                    response.err = false;
                    response.token = token;
                    callback(response);

                } else {
                    response.success = false;
                    response.message = "Wrong password"
                    response.err = err;
                    callback(response);
                }
            }
        });
    }else {
        response.success = false;
        response.message = "Invalid username/password"
        response.err = true;
        callback(response);
    }
}


//------------------------------------------------------------
function main(){

    mongoose.connect('mongodb://localhost:27017/ConnectionTesting',{ useNewUrlParser: true });
    let db = mongoose.connection;
        db.on('error', console.log.bind(console, 'Connection error: '));
        db.once('open', () => {
            console.log('We are connected to DB!')

            app.emit('ready'); //Start app
        });
    
    
    let handler = new HandlerGenerator();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(morgan('combined'));


    app.post('/login', handler.login );
    app.get('/', middleware.checkCookie, handler.index );
    app.get('/login', handler.loginPage)
    app.get('/register', handler.registerPage)
    app.post('/register', handler.register)


    app.on('ready', () => { //Wait for mongoose to connect to db
        io.on('connection', (socket) =>{
            console.log(chalk.green('A user has connected!'));
            socket.on('click', (msg)=>{
                console.log('From client: ' + msg);
                
            });
            socket.on('disconnect', ()=>{
                console.log(chalk.bgRed('A user has dissconnected'));
                
            });
        });

        http.listen(config.port, () => {
            console.log(`Server is listening on port: ${config.port}`);
            
        });
    });

}

main();

/*
//APP STARTS HERE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//LOGIN
app.get('/test', ( req, res ) => {
    res.sendFile('test.html', {root: __dirname});
});
app.get('/login',  function(req,res){
    console.log('Login menu');
    res.sendFile('login.html', {root: __dirname}, (err)=>{
        if(err){
            next(err)
        } else {
            console.log('File successfully sent');
            
        }
    });
});
app.post('/login', (req,res)=>{
    console.log('Post login');
        
        let token = signToken(config.user.username);
        console.log(token);
        
        res.status(200).json({token});

    
})

//MIDDLEWARE
app.use(function(req,res,next){
    console.log('Middleware', req.cookies);
    if(req.cookies.cookieName == '1'){
        console.log('Success');
        next();

    } else {
        console.log('Failure');
        res.redirect('/login');
    }
})

//LOGIN REQUIRED PAGES
app.get('/main', (req,res) => {
    res.send('Main page');
});
app.get('/', (req,res) => {
    res.send('Yes');
});

app.listen(config.port, function(){
    console.log('Listening at: ', + config.port);

    
});
//FUNCTIONS

//Sign token
function signToken(name){
    let payload = {
        username: name,
        id: '1a2'
    };
    let token = jwt.sign(payload, config.secret, {expiresIn: '14 days'});
    return token;
}
*/