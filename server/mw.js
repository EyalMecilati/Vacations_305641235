const jwt = require('jsonwebtoken');

const onlyAdmins = (req, res, next) => {
    const header = req.headers['authorization'];
    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        jwt.verify(token, 'secret', (err, decoded) => {
            if (err) {
                res.sendStatus(401);
                throw err;
            }
            if (decoded.is_admin) {
                next();
            } else {
                res.status(403).send('not an admin')
            }
        })
    } else {
        res.status(401).send('token not found');
    }
}

const onlyUsers = async (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        if (typeof header !== 'undefined') {
            const bearer = header.split(' ');
            const token = bearer[1];
            req.token = token;
            jwt.verify(token, 'secret', (err, decoded) => {
                if (err) {
                    res.sendStatus(401);
                    throw err;
                }
               else if (decoded.user_id) {
                    req.user_idd = decoded.user_id
                    req.decoded = decoded
                    next()
                } else {
                    res.status(403).send('user not rejisterd')
                }
            })
        } else {
            res.status(401).send('token not found');
        }
    } catch (errors) {
        res.status(401).send('not your page');
    }
}

module.exports = { onlyAdmins, onlyUsers };

