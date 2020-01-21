var mongoose = require("mongoose"); // add mongoose module
var Schema = mongoose.Schema;

const bcrypt = require('bcryptjs'); // to use for the one way encryption of passwords

// define userSchema
var userSchema = new Schema({
    "userName":  {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
  }]
});

let User; // to be defined on new connection (see initialize)

// connect to our MongoDB and initialize our "User" object
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://vderksen:Togliatti0309!@web322-dg6n8.mongodb.net/web322_a6");
        
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

// do data validation and save new userData to the database 
module.exports.registerUser = function(userData){
    return new Promise(function(resolve, reject){
        if(userData.password != userData.password2){
            reject ("Passwords do not match");
        } else {
            // Encrypt the user's password
            bcrypt.genSalt(10, function(err, salt) { // try to generate the salt 
                bcrypt.hash(userData.password, salt, function(err, hash) { // try to hash the password
                if (err) {
                    reject("There was an error encrypting the password")
                } else {
                    // Store the resulting "hash" value in the DB
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save((err)=> {
                        if(err){
                            if(err.code==11000) reject("User Name already taken");
                            else reject("There was an error creating the user: err" + err);
                        }else{
                            resolve();
                        }
                    })
                }
            })})
        }
    })
}

//  find the user in the database whose userName property matches userData.userName
// check if passwords are matched
module.exports.checkUser = function(userData){
    return new Promise(function(resolve, reject) {
        User.find({userName: userData.userName})
        .exec()
        .then((users)=>{
            // if users is an empty array
            if(!users) reject("Unable to find user: " + userData.userName);
            else {
                // if(users[0].password != userData.password) reject("Incorrect Password for user" + userData.userName);
                // users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                
                // compare encrypted password with entered password (plain text)
                bcrypt.compare(userData.password, users[0].password)
                .then((res) => {
                    // res === true if it matches and res === false if it does not match
                    if(res === true){
                        users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                        User.update(
                            { userName: users[0].userName },
                            { $set: {loginHistory: users[0].loginHistory }},
                            { multi: false }
                        ).exec()
                        .then((() => {resolve(users[0]);}))
                    //.catch((err) => {
                    //    reject("There was an error verifying the user: " + err);
                   // });
                    } else {
                        reject(`Incorrect Password for user: ${userData.userName}`);
                    }})
                //.catch((err)=> reject("Unable to find user: " + userData.userName));
            };})
        .catch((err) => reject("Unable to find user: " + userData.userName));
    })
}