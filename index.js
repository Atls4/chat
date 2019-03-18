/*:TODO: 
Login email doesnt do anything
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

const models = require('./models');
let User = models.User;

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
function chatApp(){

    io.on('connection', (socket) =>{    //USER CONNECTED
        console.log(chalk.green('A user has connected!'));

        //USER SENT SOMETHING
        socket.on('send_message', (message)=>{
            console.log(chalk.blue(`Message received (${message.color})`));

            let sendMessage = {
                username: String,
                text : String,
                color: message.color || 'grey',
                role: undefined
            };


            //VERIFY TEXT
            verifyText(message.text, ()=>{
                //VERIFY TOKEN        
                jwt.verify(message.token, config.secret, (err, decoded)=>{
                    if(err){
                        console.log(err);
                    } else if (decoded.username){
                        sendMessage.username = decoded.username || 'Error_Username_Not_Found';
                        sendMessage.text = message.text;
                        //SEND MESSAGE TO EVERYONE
                        io.emit('get_message', sendMessage); //io.emit socket.emit
                        console.log(chalk.blue('Message sent\n'));

                    }
                });
            });

            
        });
        //DISCONNECT
        socket.on('disconnect', ()=>{        
            console.log(chalk.bgRed('A user has dissconnected'));

        });
    });
}
//-----------------------------------------------------------------------
function verifyText(text,callback){
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


    app.post('/login', handler.login );
    app.get('/', middleware.checkCookie, handler.index );
    app.get('/login', handler.loginPage)
    app.get('/register', handler.registerPage)
    app.post('/register', handler.register)


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