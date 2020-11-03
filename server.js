const express = require('express');
const mysql = require('mysql');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt_decode = require('jwt-decode');

const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');

const PORT = 3000;
const secretKey = 'My super secret key';
const saltRounds = 10;
let token;

var pool  = mysql.createPool({
    host: 'sql9.freemysqlhosting.net',
    user: 'sql9373689',
    password: 'vhPqVDD3YH',
    database: 'sql9373689'
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256']
});

// let users = [
//     {
//         id: 1,
//         username: 'ramya',
//         password: '123'
//     },
//     {
//         id: 1,
//         username: 'hegde',
//         password: '456'
//     }
// ];

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    // for (let user of users) {
    //     if (username == user.username && password == user.password) {
    //         token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '3m' });
    //         var decoded = jwt_decode(token);
    //         console.log(decoded.exp);
    //         res.json({
    //             success: true,
    //             err: null,
    //             exp: decoded.exp,
    //             token
    //         });
    //         break;
    //     }
    //     else {
    //         res.status(401).json({
    //             success: false,
    //             err: 'username or password is incorrect',
    //             token: null
    //         });
    //     }
    // }
    pool.getConnection(function (err,connection) {
        if (err) {
            return res.status(400).json({
                success: false,
                err: 'error ocurred while connecting to database',
                token: null
            });
        }
        console.log("Connected TO MYSQL DB!");
        connection.query('SELECT * FROM users WHERE username = ?', [username], async function (error, results, fields) {
            connection.release();
            if (error) {
                return res.status(400).json({
                    success: false,
                    err: 'error ocurred while fetching user details',
                    token: null
                });
            } else {

                if (results.length > 0) {
                    const comparePwd = await bcrypt.compare(password, results[0].password)
                    if (comparePwd) {
                        token = jwt.sign({ id: results[0].id, username: results[0].username }, secretKey, { expiresIn: '3m' });
                        var decoded = jwt_decode(token);
                        console.log(decoded.exp);
                        return res.status(200).json({
                            success: true,
                            err: null,
                            exp: decoded.exp,
                            token
                        })
                    }
                    else {
                        return res.status(204).json({
                            success: false,
                            err: 'username and password does not match',
                            token: null
                        });
                    }
                }
                else {
                    return res.status(206).json({
                        success: false,
                        err: 'user does not exit',
                        token: null
                    });
                }
            }
        })
    });
    
});

app.post('/api/signup', async (req, res) => {
    const { username, password, email } = req.body;
    const encryptedPassword = await bcrypt.hash(password, saltRounds)
    const signUpDate = new Date().toJSON().slice(0, 10);
    var user = {
        "username": username,
        "password": encryptedPassword,
        "email": email,
        "date": signUpDate
    }
    pool.getConnection(function (err,connection) {
        if (err) {
            return res.status(400).json({
                success: false,
                err: 'error ocurred while connecting to database'
            });
        }
        console.log("Connected to mysql database!");
        connection.query('INSERT INTO users SET ?', user, function (error, results, fields) {
            connection.release();
            if (error) {
                return res.status(400).json({
                    success: false,
                    err: 'error ocurred while signup'
                })
            } else {
                return res.status(200).json({
                    success: true,
                    err: null,
                    msg: 'user registered sucessfully!'
                })
            }

        });
    });
});

app.get('/api/dashboard', jwtMW, (req, res) => {
    res.json({
        success: true,
        myContent: 'Secret content that only logged in people can see!!!'
    });
});

app.get('/api/settings', jwtMW, (req, res) => {
    res.json({
        success: true,
        myContent: 'You are in settings page!!!'
    });
});
app.get('/', (req, res) => {
    // res.sendFile(path.join(__dirname, 'index.html'));
    pool.getConnection(function (err,connection) {
        if (err) {
            return res.status(400).json({
                success: false,
                err: 'error ocurred while connecting to database'
            });
        }
    connection.query('SELECT * FROM users', function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.json(results);
    });
});
});

app.use(function (err, req, res, next) {
    console.log(err.name === 'UnauthorizedError');
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            err
        });
    }
    else {
        next(err);
    }

})

app.listen(PORT, () => {
    console.log(`serving on port ${PORT}`);
});