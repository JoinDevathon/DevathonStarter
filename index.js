const mysql = require('mysql');
const fetch = require('node-fetch');
const {createTransport} = require('nodemailer');
const {execFileSync} = require('child_process');
const P_TOKEN = 'af36284f3ebdcbb56de18a24cae7a85b7a1cdd87';

const transporter = createTransport({
    service: 'gmail',
    auth: {
        user: 'joindevathon@gmail.com',
        pass: 'a2096d45-a57e-4f77-8422-877ffc234e46'
    }
});

const pool = mysql.createPool({
    connectionLimit: 2,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'devathon'
});

function createRepositories(usernames) {
    // create a repository for each, then run a bash script to push to it
    Promise.all(usernames.map(username => fetch(`https://DevathonBot:${P_TOKEN}@api.github.com/orgs/JoinDevathon/repos`, {
            method: 'POST',
            headers: {
                'User-Agent': 'DevathonStarter',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${username}-2016`,
                description: 'This is the repository for your Devathon Project.',
                homepage: 'https://devathon.org',
                private: true,
            })
        })
            .then(res => {
                return fetch(`https://DevathonBot:${P_TOKEN}@api.github.com/repos/JoinDevathon/${username}-2016/collaborators/${username}`, {
                    method: 'PUT',
                    headers: {
                        'User-Agent': 'DevathonStarter',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        permission: 'push'
                    })
                })
            })
    ))
        .then(() => console.log('Made repos for', usernames))
        .then(() => {
            // run our bash script to push content to the repositories
            execFileSync('bash', ['./push-contents.sh', P_TOKEN].concat(usernames), {
                stdio: ['inherit', 'inherit', 'inherit']
            });
        })
        .catch(err => console.error('Failed to make repos for', usernames, err));
}

function unprivateAndAdd(usernames) {
    Promise.all(usernames.map(username => fetch(`https://DevathonBot:${P_TOKEN}@api.github.com/repos/JoinDevathon/${username}-2016/collaborators/${username}`, {
        method: 'PUT',
        headers: {
            'User-Agent': 'DevathonStarter',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            permission: 'push'
        })
    })))
        .then(Promise.all(usernames.map(username => fetch(`https://DevathonBot:${P_TOKEN}@api.github.com/repos/JoinDevathon/${username}-2016`, {
            method: 'PATCH',
            headers: {
                'User-Agent': 'DevathonStarter',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${username}-2016`,
                private: false
            })
        }))));
}

function sendEmails(users) {
    users.forEach(({email, username}) => {
        transporter.sendMail({
            from: '"Devathon" <joindevathon@gmail.com>',
            to: email,
            subject: 'Devathon Has Started!',
            text: `Devathon has just started. Your project is located at https://github.com/JoinDevathon/${username}-2016`,
            html: `Devathon has just started. Your project is located at https://github.com/JoinDevathon/${username}-2016`,
        }, (err, info) => {
            if (err) {
                console.error('Failed to send email to', email, username, err);
            }
        })
    })
}

function start() {
    pool.query('SELECT `username`,`email` FROM `users`', function (err, rows) {
        if (err) {
            throw err;
        }
        const usernames = rows.map(({username}) => username);
        createRepositories(usernames);
        sendEmails(rows);
    });
}

function doStuff() {
    pool.query('SELECT `username`,`email` FROM `users`', function (err, rows) {
        if (err) {
            throw err;
        }
        const usernames = rows.map(({username}) => username);
        unprivateAndAdd(usernames);
    });
}


function closeRepositories(usernames) {
    Promise.all(usernames.map(username => fetch(`https://DevathonBot:${P_TOKEN}@api.github.com/repos/JoinDevathon/${username}-2016/collaborators/${username}`, {
        method: 'DELETE',
        headers: {
            'User-Agent': 'DevathonStarter',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })))
        .catch(err => console.error('Failed to close repositories', err));
}

function end() {
    pool.query('SELECT `username` FROM `users`', function (err, rows) {
        if (err) {
            throw err;
        }
        const usernames = rows.map(({username}) => username);
        closeRepositories(usernames);
    });
}

const START = new Date(1478350800 * 1000);
const END = new Date(1478440800 * 1000);
const NOW = Date.now();

// setTimeout(start, START - NOW);
setTimeout(end, END - NOW);
doStuff();

