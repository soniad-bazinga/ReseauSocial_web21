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
    let max_id = req.query.max_id;
    // On récupère les nouveaux posts
    let q = await client.query("SELECT * FROM post WHERE id_post > $1 ORDER BY id_post DESC", [max_id]);
    // Puis les likes associés
    for (e in q.rows) {
        let l = await client.query("SELECT * FROM post_like WHERE id_post = $1", [q.rows[e].id_post]);
        q.rows[e].likes = l.rows;
    }
    res.json(q.rows);
});

app.listen(4000);