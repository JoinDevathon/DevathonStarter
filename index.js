const mysql = require('mysql');
const fetch = require('node-fetch');
const {execFileSync} = require('child_process');
const P_TOKEN = 'af36284f3ebdcbb56de18a24cae7a85b7a1cdd87';

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

pool.query('SELECT `username` FROM `users`', function (err, rows) {
    if (err) {
        throw err;
    }
    const usernames = rows.map(({username}) => username);
    createRepositories(usernames);
    pool.end();
});
