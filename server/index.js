const express = require('express');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { onlyAdmins, onlyUsers } = require('./mw')



app.use(express.json());
app.use(require('cors')());
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'project_3'
});

db.connect((err) => {
    if (err) {
        throw err
    }
    console.log("sql is operational");
});

app.post('/users/register', async (req, res) => {
    const { first_name, last_name, username, password } = req.body;
    if (first_name && last_name && username && password) {
        const q = `
        SELECT * FROM users
        `
        const users = await Query(q);
        const user = await users.find(user => user.username === username);
        if (user != null) {
            return res.status(400).send('username is alredy taken');
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const q = `
        INSERT INTO users(first_name,last_name,username,password,is_admin)
        VALUES ("${first_name}","${last_name}","${username}","${hashedPassword}",0)
        `
            const users = await Query(q);
            res.send('worked');
        } catch {
            res.status(500).send("missing details");
        }

    } else {
        res.sendStatus(400);
    }
})

app.post('/users/login', async (req, res) => {
    const q = `
    SELECT * FROM users
    `
    const users = await Query(q);
    const user = await users.find(user => user.username === req.body.username);
    if (user == null) {
        return res.status(400).send('Cannot Find User');
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ username: user.username, is_admin: user.is_admin, user_id: user.id }, "secret");

            res.json(token);
        } else {
            res.send('Not Allowed');
        }
    } catch {
        res.status(500).send('internal problem');
    }
})

app.get('/vacations', onlyUsers, async (req, res) => {
    try {
        const q = `
        SELECT 
        vacations.id,
        vacations.description,
        vacations.destination,
        vacations.img_url,
        vacations.departure_date,
        vacations.arrival_date,
        vacations.price,

        COUNT(vacation_id) AS followers_count
        FROM vacations
        LEFT JOIN followers
        ON vacations.id = vacation_id
        GROUP BY
        vacations.id,
        vacations.description,
        vacations.destination,
        vacations.img_url,
        vacations.departure_date,
        vacations.arrival_date,
        vacations.price
        `

        const vacationInfo = await Query(q);
        res.json({'vacationInfo':vacationInfo,'decoded':req.decoded});
    } catch (err) {
        res.status(401).send('not suposed to be here');
    }

})


app.get('/vacations-by-follow', onlyUsers, async (req, res) => {
    try {
        const q = `
       select 
		vacations.id,
        vacations.description,
        vacations.destination,
        vacations.img_url,
        vacations.departure_date,
        vacations.arrival_date,
        vacations.price,
        followers.users_id,
		followers.vacation_id
		FROM vacations
		inner JOIN followers ON followers.vacation_id = vacations.id
        WHERE followers.users_id = ?
        `
        const vacationInfo = await Query(q, [req.user_idd]);
        res.json(vacationInfo);
    } catch (err) {
        res.status(401).send('not suposed to be here');
    }

})

app.post('/vacations/destination', async (req, res) => {
    const q = `
    SELECT * FROM vacations WHERE DATE(departure_date) <= ? AND DATE(arrival_date) >= ?
    `
    const vacationInfo = await Query(q, req.body.arrival_date, req.body.departure_date);
    res.json(vacationInfo);
})

app.get('/admin-vacations', onlyAdmins, async (req, res) => {
    const q = `
    SELECT 
    vacations.id,
    vacations.description,
    vacations.destination,
    vacations.img_url,
    DATE(vacations.departure_date),
    DATE(vacations.arrival_date),
    vacations.price,
    COUNT(vacation_id) AS followers_count
    FROM vacations
    LEFT JOIN followers
    ON vacations.id = vacation_id
    GROUP BY
    vacations.id,
    vacations.description,
    vacations.destination,
    vacations.img_url,
    vacations.departure_date,
    vacations.arrival_date,
    vacations.price
    `
    const vacationInfo = await Query(q);
    res.json(vacationInfo);
})

app.get('/admin-vacations/delete-vacations/:id', onlyAdmins, async (req, res) => {
    const q = `
    DELETE FROM vacations WHERE vacations.id = ? 
    `
    const vacationInfo = await Query(q, req.params.id);
    res.json(vacationInfo);
})

app.post('/admin-vacations/add-vacations', onlyAdmins, async (req, res) => {
    const { description, destination, img_url, departure_date, arrival_date, price } = req.body
    const q = `
    INSERT INTO vacations(description, destination, img_url, departure_date, arrival_date, price)  
    VALUES("${description}","${destination}","${img_url}","${departure_date}","${arrival_date}",${price})
    `
    const vacationInfo = await Query(q);
    res.json(vacationInfo);
})

app.delete('/vacations/unfollow/:id', onlyUsers, async (req, res) => {
    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        jwt.verify(token, 'secret', async (err, decoded) => {
            if (err) {
                res.sendStatus(401);
                throw err;
            }
            if (decoded.user_id) {
                const q = `
                DELETE FROM followers
                WHERE
                vacation_id = ?
                AND
                users_id = ?
                `
                await Query(q, req.params.id, decoded.user_id);
                const q2 = `
                SELECT 
                users.id,
                users.username,
                vacations.id
                FROM followers
                INNER JOIN users ON users.id = followers.users_id
                INNER JOIN vacations ON vacations.id = followers.vacation_id
                WHERE users.id = ?
                `
                const followe = await Query(q2, decoded.user_id);
                res.json(followe);
            } else {
                res.status(403).send('not rejister')
            }
        })
    } else {
        res.status(401).send('token not found');
    }
})

app.post('/vacations/follow', onlyUsers, async (req, res) => {

    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        jwt.verify(token, 'secret', async (err, decoded) => {
            if (err) {
                res.sendStatus(401);
                throw err;
            }
            if (decoded.user_id) {
                const q =
                    `
                INSERT INTO followers(vacation_id, users_id)
                VALUES ("${req.body.id}","${decoded.user_id}")
                `
                await Query(q);
                const q2 = `
                SELECT 
                users.id,
                users.username,
                vacations.id
                FROM followers
                INNER JOIN users ON users.id = followers.users_id
                INNER JOIN vacations ON vacations.id = followers.vacation_id
                WHERE users.id = ?
                `
                const followe = await Query(q2, decoded.user_id);
                res.json(followe);
            } else {
                res.status(403).send('not rejister')
            }
        })
    } else {
        res.status(401).send('token not found');
    }

})

app.get('/vacation/followers', onlyUsers, (req, res) => {

    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        jwt.verify(token, 'secret', async (err, decoded) => {
            if (err) {
                res.sendStatus(401);
                throw err;
            }
            if (decoded.user_id) {
                const q = `
                SELECT 
                users.id,
                users.username,
                vacations.id
                FROM followers
                INNER JOIN users ON users.id = followers.users_id
                INNER JOIN vacations ON vacations.id = followers.vacation_id
                WHERE users.id = ?
                `
                const followe = await Query(q, [decoded.user_id]);
                console.log(followe)
                res.json(followe);
            } else {
                res.status(403).send('not rejister')
            }
        })
    } else {
        res.status(401).send('token not found');
    }



})

app.listen(1000, console.log('port 1000 is operational'));

function Query(q, ...par) {
    return new Promise((resolve, reject) => {
        db.query(q, par, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    })
}