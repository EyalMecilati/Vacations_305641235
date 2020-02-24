const router = require('express').Router();
const { onlyAdmins, onlyUsers } = require('../mw');
const db = require('../connection');


router.get('/', async (req, res) => {
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
    const vacationInfo = await connection.Query(q);
    res.json(vacationInfo);
})

// app.get('/vacations/followers', async (req, res) => {
//     const q = `
//     SELECT * FROM followers
//     WHERE user_id = ?
//     `
//     const vacationInfo = await Query(q,);
//     res.json(vacationInfo);
// })

router.delete('/unfollow', onlyUsers, async (req, res) => {
    const q = `
    DELETE FROM followers
    WHERE
      vacation_id = ?
    and
      users_id = ?
    `
    const followers = await connection.Query(q, req.body.vacationId, req.body.userId);
    res.json(followers);
})

router.post('/follow',onlyUsers, async (req, res) => {
    const q =
        `
    INSERT INTO followers(vacation_id, users_id)
    VALUES (${req.body.vacationId},${req.body.userId})
    `
    const followers = await connectionQuery(q);
    res.json(followers);
})

module.exports = router

