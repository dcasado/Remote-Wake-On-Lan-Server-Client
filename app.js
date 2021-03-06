const express = require('express');
const wol = require('wake_on_lan');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const config = require('./config');

const cors = require('cors');

const exec = require('child_process').exec;

const app = express();

var corsOptions = {
    origin: config.corsOrigin,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/computers', function (req, res) {
    let computers = [];
    for (computer of config.computers) {
        computers.push({ name: computer.name });
    }
    res.contentType('application/json');
    res.send(computers);
});

app.get('/computers/:computer', function (req, res) {
    let computer = req.params.computer;
    try {
        ping(config.computers[computer].ip, res);
    } catch (err) {
        res.contentType('application/json');
        res.status(400).send({ 'message': 'Bad request' });
    }
});

app.post('/wake', function (req, res) {
    try {
        var computer = req.body.computer;
        var password = req.body.password;
        if (config.hash_password == crypto.createHash(config.hashMethod).update(password).digest('hex')) {
            var mac = config.computers[computer].mac;
            wol.wake(mac, { address: "192.168.0.255" }, (error) => {
                console.log(error)
            });

            let count = 0;
            pingRec(config.computers[computer].ip, res, ++count);
        } else {
            res.status(200).send({ 'message': 'Wrong password' });
        }
    } catch (err) {
        res.contentType('application/json');
        res.status(400).send({ 'message': 'Bad request' });
    }
});

function pingRec(ip, res, count) {
    if (count < config.pingCounter) {
        exec('ping -c 1 ' + ip, function (error, stdout, stderr) {
            if (error !== null) {
                pingRec(ip, res, ++count);
            } else {
                res.contentType('application/json');
                res.status(200).send({ "state": config.awake });
            }
        });
    } else {
        res.contentType('application/json');
        res.status(200).send({ "state": config.asleep });
    }
}

function ping(ip, res) {
    exec('ping -c 1 -W 2 ' + ip, function (error, stdout, stderr) {
        if (error !== null) {
            res.status(200).send({ 'state': config.asleep });
        } else {
            res.status(200).send({ 'state': config.awake });
        }
    });
}

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
