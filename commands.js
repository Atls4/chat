module.exports = {
    starts : function(io,socket,command,callback){
        let commandMessage = {
            success: Boolean,
            from: 'system',
            type: 'command',
            action: String,
            details: Object

        }

        
        switch(command.command[0]){
            case 'ban': {
                if(command.role === 'admin' || command.role === 'moderator'){
                    commandMessage.success = true;
                    commandMessage.action = 'ban';
                    commandMessage.details = {
                        username: command.command[1],
                        time: command.command[2] || null,
                        reason: command.command[3] || null,
                        message: `"${command.command[1]}" banned from chat`
                    }
                    io.emit('get_message', commandMessage);
                    callback(commandMessage);
                } else {

                    commandMessage.success = false;
                    commandMessage.details.message = "You don't have the premission to do this action";

                    socket.emit('get_message', commandMessage);
                    callback(commandMessage);
                    
                }
            }
            break;
            case 'mod': {
                if(command.role === 'admin'){
                    commandMessage.success = true;
                    commandMessage.action = 'mod',
                    commandMessage.details = {
                        username: command.command[1],
                        reason: command.command[2],
                        message: `"${command.command[1]}" has been promoted to moderator!`
                    }

                    socket.emit('get_message', commandMessage);
                    callback(commandMessage);

                    } else {
                        commandMessage.success = false;
                        commandMessage.details.message = "You don't have the premission to do this action";
                        socket.emit('get_message', commandMessage);
                        callback(commandMessage);
                }
            }
            break;
            case 'help': {
                if(command.command[1] == null){
                    commandMessage.success = true;
                    commandMessage.action = 'help',
                    commandMessage.details = {
                        message: 'Commands available to you in this room (use /help <command> for details): /help /w /me /disconnect /mods /vips /color /user',
                    }

                    socket.emit('get_message', commandMessage);
                    callback(commandMessage);
                } else {

                }
            }
            break;
            default : {
                commandMessage.success = false;
                commandMessage.details.message = 'Unknown command'
                socket.emit('get_message', commandMessage);
                callback(commandMessage);
            }
            break;
        }
    }
}

