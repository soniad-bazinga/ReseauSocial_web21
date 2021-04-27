const express = require('express');
// Pour le CORS dans le header (autorise les requêtes via d'autre servers)
var cors = require('cors');

var app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const { Client } = require('pg');
const client = new Client({
    user: 'yasmclient',
    host: 'localhost',
    database: 'yasm',
    password: 'pwd',
    port: 5432
});
client.connect().catch(err => { console.log(err) });

// Permet de récupèrer les publications 
app.get('/publications', async (req, res) => {
    let user_id = parseInt(req.query.user_id);
    let max_id = req.query.max_id;
    // On récupère les nouveaux posts
    let q = await client.query("SELECT * FROM post p JOIN client c on p.id_client = c.id_client WHERE p.id_post > $1 ORDER BY p.id_post", [max_id]);
    // Puis les likes associés
    for (e in q.rows) {
        // On récupère les likes
        let l = await client.query("SELECT * FROM post_like WHERE id_post = $1", [q.rows[e].id_post]);
        q.rows[e].likes = l.rows;
        // On récupère les hashtags
        let h = await client.query("SELECT tag FROM hashtag WHERE id_post = $1", [q.rows[e].id_post]);
        q.rows[e].hashtags = [];
        for (i in h.rows) {
            q.rows[e].hashtags.push(h.rows[i].tag);
        }
        // Et le mentions
        let m = await client.query("SELECT username FROM mention WHERE id_post = $1", [q.rows[e].id_post]);
        q.rows[e].mentions = [];
        for (i in m.rows) {
            q.rows[e].mentions.push(m.rows[i].username);
        }
        // Enfin, on regarde si l'utilisateur a liké
        q.rows[e].liked = q.rows[e].likes.some(e => e.id_client === user_id);
    }
    res.json(q.rows);
});

app.post('/send_publication', async (req, res) => {
    let user_id = parseInt(req.body.user_id);
    let message = req.body.message;
    let hashtags = req.body.hashtags;
    let mentions = req.body.mentions;
    // On insère le post
    let id = (await client.query("INSERT INTO post(id_client, content) VALUES ($1, $2) RETURNING id_post;", [user_id, message])).rows[0].id_post;
    for (i in hashtags) {
        h = hashtags[i];
        await client.query("INSERT INTO hashtag(id_post, tag) VALUES ($1, $2);", [id, h]);
    }
    for (i in mentions) {
        m = mentions[i];
        await client.query("INSERT INTO mention(id_post, username) VALUES ($1, $2);", [id, m]);
    }
    // On retourne une réponse positive
    res.json(true);
});

app.post('/like_publication', async (req, res) => {
    let user_id = parseInt(req.body.user_id);
    let post_id = req.body.post_id;
    let liked = req.body.liked;

    let n = await (await client.query("SELECT * FROM post_like WHERE id_client = $1 AND id_post = $2;", [user_id, post_id])).rowCount;
    if (liked && n == 0) {
        await client.query("INSERT INTO post_like(id_client, id_post) VALUES ($1, $2);", [user_id, post_id]);
    } else if (n > 0) {
        await client.query("DELETE FROM post_like WHERE id_client = $1 AND id_post =  $2;", [user_id, post_id]);
    } else {
        res.json(false);
        return;
    }
    res.json(true);
});

app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username.trim() === "" || password.trim() === "") return res.json({ logged: false });
    let e = await (await client.query("SELECT * FROM client WHERE username = $1 and password = $2", [username, password]));
    let s = await (await client.query("SELECT * FROM subscriber WHERE id_from = $1;", [e.rows[0].id_client]));
    res.json({ logged: e.rowCount > 0, u_id: e.rows[0].id_client, username: e.rows[0].username, subscribed: s.rows });
});

app.listen(4000);