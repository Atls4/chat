/*:TODO: 
Login email doesnt do anything
Fix COMMANDS
React stuff
Update 3 - Login with email works, fixed bug where wrong id would not do anything
*/
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
const commands = require('./commands');

const models = require('./models');
let User = models.User;
let BlackList = models.BlackList;

//------------------------------------------------------------------
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
            identification: req.body.id.toLowerCase(),
            password: req.body.password,
        };
        /*
        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        */
        if(userInfo.identification.includes('@')){
            validateLogin(User, userInfo, 'email', (data)=>{
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
        } else {
            validateLogin(User, userInfo, 'username', (data)=>{
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
    styleCSS (req,res){
        res.sendFile('style.css', {root: __dirname}, (err) => {
            if(err){
                console.log(err);
                
            } else {
                console.log('StyleCSS file sucessfully sent');
                
            }
        });
    }
    resetCSS (req,res){
        res.sendFile('reset.css', {root: __dirname}, (err) => {
            if(err){
                console.log(err);
                
            } else {
                console.log('ResetCSS file sucessfully sent');
                
            }
        });
    }
}
//======================================================================
//=====================Login function===================================
//======================================================================

function validateLogin(model, data, mode, callback){
    let response = {};
    //ID AND PASSWORD EXISTS
    if(data.identification && data.password){
        //USERNAME 
        if(mode === 'username'){
            model.findOne({username: data.identification}, (err,doc) => {
                //ERROR
                if(err){
                    console.log(err);
                    
                    response.success = false;
                    response.message = "Something went wrong"
                    response.err = err;
                    callback(response);
                } else {
                    //USERNAME NOT FOUND
                    if(doc === null ){

                        response.success = false;
                        response.message = "Username not found"
                        response.err = err;
                        callback(response);
                    //USERNAME FOUND
                    } else if(doc.username == data.identification && doc.password === data.password){
                        //SIGN TOKEn
                        let tokenData = {
                            username: doc.username,
                            role: doc.role
                        }
                        let token = jwt.sign(tokenData, config.secret); //Modify in future
                        
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
        //EMAIL
        } else if(mode === 'email'){
            model.findOne({email: data.identification}, (err,doc) => {
                if(err){
                    console.log(err);
                    
                    response.success = false;
                    response.message = "Something went wrong"
                    response.err = err;
                    callback(response);
                } else {
                    if(doc === null ){

                        response.success = false;
                        response.message = "Email not found"
                        response.err = err;
                        callback(response);
                    
                    } else if(doc.email == data.identification && doc.password === data.password){
                        //SIGN TOKEn
                        let tokenData = {
                            username: doc.username,
                            role: doc.role
                        }
                        let token = jwt.sign(tokenData, config.secret); //Modify in future
                        
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
        }
    //ID AND PASSWORD DOESNT EXISTS
    } else {
        response.success = false;
        response.message = "Invalid username/password"
        response.err = true;
        callback(response);
    }
}


//------------------------------------------------------------
function chatApp(){

    io.on('connection', (socket) =>{    //USER CONNECTED
        console.log(chalk.green('A user has connected!'));

        //USER SENT SOMETHING
        socket.on('send_message', (message)=>{
            console.log(chalk.blue(`\nMessage received (${message.color})`));

            let sendMessage = {
                username: String,
                text : String,
                color: message.details.color || [170,100,230],
                role: undefined,
                type: 'standard',
                details : {}
            };

            jwt.verify(message.token, config.secret, (err, decoded)=>{
                //IF TOKEN IS WRONG
                if(err){
                    console.log(chalk.red('Bad token'), err);

                    let errorMessage = {
                        username: null,
                        text: 'Wrong token',
                        color: 'red',
                        role: null,
                        type: 'error'
                    };
                    socket.emit('get_message', errorMessage)
                //IF TOKEN IS GOOD
                } else if (decoded.username){
                    
                    //VERIFY IF TEXT IS CORRECT
                    verifyText(message.text, ()=>{
                        //===================================================================
                        //==================CHECK IF TEXT IS COMMAND=========================
                        //===================================================================
                        if(message.text.startsWith('/')){
                            console.log(chalk.green(`Command received: [${message.text}]`));
                            
                            let commandData = {
                                role: decoded.role,
                                command: []
                            };
                            commandData.command = message.text.substr(1).split(" ");
                            
                            commands.starts(io,socket,commandData, (message)=>{

                                console.log(chalk.yellow(message.type, message.text));
                                if(message.success){
                                    if(message.action === 'ban'){
                                        //Add user to banlist
                                        BlackList.findOne({username: message.details.username}, (err,result) => {
                                            if(result == null){
                                                
                                                //Add user to banlist
                                                let member = new BlackList({
                                                    username: message.details.username,
                                                });
                                                member.save( (err)=>{
                                                    if(err){
                                                        console.log(err);
                                                        
                                                    } else {
                                                        console.log('User banned');
                                                        
                                                    }
                                                })
                                            } else {
                                                console.log(chalk.yellow(message.details.username, 'Already on blacklist'));
                                                let errorMessage = {
                                                    from: 'system',
                                                    type: 'error',
                                                    text: 'User already banned'
                                                }
                                                socket.emit('get_message', errorMessage);
                                            }
                                        });
                                    }
                                }
                                
                            });

                        } else {

                            sendMessage.username = decoded.username || 'Error_Username_Not_Found';
                            sendMessage.text = message.text;
                            sendMessage.from = 'user';
                            sendMessage.type = 'message';
                            sendMessage.details.message = message.details.message;
                            //SEND MESSAGE TO EVERYONE
                            io.emit('get_message', sendMessage); //io.emit socket.emit
                            console.log(chalk.blue('Message sent to everyone\n'));
                        }
                    });

                }
            });            
            
        });
        //DISCONNECT
        socket.on('disconnect', ()=>{        
            console.log(chalk.bgRed('A user has dissconnected'));

        });
    });
}
//-----------------------------------------------------------------------
function doCommands(command, token){
    switch(command){
        case "ban": {

        }
        break;

        default: null
        break;
    }
    
}
//-----------------------------------------------------------------------
function verifyText(text, callback){
    if(text){
        let trimmed = text.trim();
        if(trimmed && trimmed !== ""){
            if(true){

                console.log(chalk.green(`Text verified: [${text}]`));
                
                callback();
            } else {
                
                //FILTERED ERROR MSG COMES HERE
            }
        } else {
            console.log(chalk.red(`EMPTY TEXT: [${text}]`));
        }   
    } else {
        console.log(chalk.red(`UNDEFINED TEXT: [${text}]`));
        
    }
}
//------------------------------------------------------------------------

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

    app.use(express.static('public'))

    app.post('/login', handler.login );
    app.get('/', middleware.checkCookie, handler.index );
    app.get('/login', handler.loginPage);
    app.get('/register', handler.registerPage);
    app.post('/register', handler.register);
    app.get('/style.css', handler.styleCSS)



    app.on('ready', () => { //Wait for mongoose to connect to db

        chatApp(); //Start chat app
        http.listen(config.port, () => { //Start server
            console.log(`Server is listening on port: ${config.port}`);
            
        });
    });

}
//--------------------------------------------------------------

main(); //Start app here

//=====================================================
//=====================================================