const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt_decode = require('jwt-decode');

const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');

const PORT = 3000;
const secretKey ='My super secret key';
let token;

app.use((req, res, next) =>{
    res.setHeader('Access-Control-Allow-Origin','http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers','Content-type,Authorization');
    next();
});



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256']
});


let users = [
    {
        id :1,
        username: 'ramya',
        password: '123'
    },
    {
        id :1,
        username: 'hegde',
        password: '456'
    }
];

app.post('/api/login', (req, res) =>{
    const { username, password} = req.body;

    for (let user of users) {
        if(username == user.username && password == user.password){
                token = jwt.sign({ id: user.id, username: user.username}, secretKey,{ expiresIn:  '3m' });
                var decoded = jwt_decode(token);
                console.log(decoded.exp);
            res.json({
                success: true,
                err: null,
                exp: decoded.exp,
                token
            });
            break;
        }
        else{
            res.status(401).json({
                success: false,
                err: 'username or password is incorrect',
                token: null
            });
        }
    }
});

app.get('/api/dashboard', jwtMW, (req, res) =>{
    res.json({
        success:true,
        myContent: 'Secret content that only logged in people can see!!!'
    });
});

app.get('/api/settings', jwtMW, (req, res) =>{
    res.json({
        success:true,
        myContent: 'You are in settings page!!!'
    });
});
app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(function (err, req, res, next){
    console.log(err.name === 'UnauthorizedError');
    if (err.name === 'UnauthorizedError'){
        res.status(401).json({
            success: false,
            err
        });
    }
    else{
        next(err);
    }

})

app.listen(PORT, () => {
    console.log(`serving on port ${PORT}`);
});