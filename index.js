var express = require('express');
var app = express();
var session = require('express-session');
var MongoDBSession = require('connect-mongodb-session')(session);
var http = require('http');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/ip-addresses');
var IpAddresses = require('./model/ipAddress');
var User = require('./model/user');
var cors = require('cors');
var bcrypt = require('bcrypt');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
const store = new MongoDBSession({
    uri: 'mongodb://localhost/ip-addresses',
    collection: 'mySessions',
})
app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: false,
    store: store,
}));
const isAuth = function (req, res, next) {
    if (req.session.isAuth) {
        next();
    } else {
        res.status(400).send("Not Authorized");
    }
}
app.get('/', function (req, res) {

    res.send("Home Page");
})
app.post('/register', async function (req, res) {
    try {

        var newUser = new User();
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        newUser.username = req.body.username;
        newUser.password = hashedPassword;
        newUser.save(function (error, savedUser) {
            if (error) {
                res.status(500).send({ error: "Couldn't create a new user" });
            } else {
                res.send(savedUser);
            }
        });
    } catch {
        res.status(500).send({ error: "Couldn't create a new user" });
    }
});

app.post('/login', async function (req, res) {
    User.find({ username: req.body.username }, function (err, users) {
        if (err) {
            res.status(500).send({ error: "Couldn't find the user" });
        } else {
            if (users.length == 0) {
                res.status(400).send({ error: "User is not found" });
            } else {

                try {
                    bcrypt.compare(req.body.password, users[0].password, function (error, isValid) {
                        if (isValid) {
                            req.session.isAuth = true;
                            res.send("success");
                        } else {
                            res.status(400).send({ error: "Invalid Password" });
                        }
                    });

                } catch {
                    res.status(500).send({ error: "Couldn't find the user" });
                }

            }
        }
    });
});
app.post('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            res.status(500).send({ error: "Couldn't log out" });
        } else {
            res.redirect("/");
        }
    })
})


app.get('/IPs', isAuth, function (req, res) {
    IpAddresses.find({}, function (err, ips) {
        if (err) {
            res.status(500).send({ error: "Couldn't return IP addresses" });
        } else {
            res.send(ips);
        }
    })

});
app.get('/IP/:ipAddress', isAuth, function (req, res) {
    var ipAddress = req.params.ipAddress;
    var api_res = '';
    IpAddresses.find({ ip_address: ipAddress }, function (err, ip) {
        if (err) {
            res.status(500).send({ error: "Couldn't find the details of this IP Address" });
        }
        else {
            if (ip.length == 0) {

                const access_key = "df7e61cdfce4dcc973318fd8fc0c6eea";
                var path1 = '/' + ipAddress + '?access_key=df7e61cdfce4dcc973318fd8fc0c6eea';
                var options = {
                    host: 'api.ipapi.com',
                    port: 80,
                    path: path1,
                    method: 'GET'
                };
                http.request(options, function (response) {

                    response.setEncoding('utf8');
                    response.on('data', function (returnedIP) {
                        var ipA = new IpAddresses();
                        const ipObject = JSON.parse(returnedIP);
                        ipA.ip_address = ipObject.ip;
                        ipA.continent_code = ipObject.continent_code;
                        ipA.continent_name = ipObject.continent_name;
                        ipA.country_code = ipObject.country_code;
                        ipA.country_name = ipObject.country_name;
                        ipA.region_code = ipObject.region_code;
                        ipA.region_name = ipObject.region_name;
                        ipA.city = ipObject.city;
                        ipA.zip = ipObject.zip;
                        ipA.save(function (error, savedIp) {
                            if (error) {
                                res.status(500).send({ error: "Couldn't save this IP address" });
                            } else {
                                res.status(200).send(savedIp);
                            }
                        });
                    });
                }).end();

            } else {
                res.send(ip[0]);
            }
        }
    })
});
app.listen(3004, function () {
    console.log("API is running on port 3004");
})
