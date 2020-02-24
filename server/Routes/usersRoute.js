const router = require('express').Router();
const jwt = require('jsonwebtoken')
const { onlyAdmins, onlyUsers } = require('../mw');
const bcrypt = require('bcrypt')
const db = require('../connection');



router.post('/register', async (req, res) => {
    const { first_name, last_name, username, password } = req.body;
    if (first_name && last_name && username && password) {
        const q = `
        SELECT * FROM users
        `
        const users = await db.Query(q);
        const user = await users.find(user => user.username === username)
        if (user != null) {
            return res.status(400).send('username is alredy taken')
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10)
            const q = `
        INSERT INTO users(first_name,last_name,username,password,is_admin)
        VALUES ("${first_name}","${last_name}","${username}","${hashedPassword}",0)
        `
            const users = await db.Query(q)
            res.send('worked')
        } catch {
            res.status(500).send()
        }

    } else {
        res.sendStatus(400);
    }
})

router.post('/login', async (req, res) => {
    const q = `
    SELECT * FROM users
    `
    const users = await db.Query(q);
    const user = await users.find(user => user.username === req.body.username)
    if (user == null) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ username: user.username, is_admin: user.is_admin }, "secret")

            res.json({ token: token });
        } else {
            res.send('Not Allowed')
        }
    } catch {
        res.status(500).send()
    }
})



module.exports = router;
