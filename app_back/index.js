const express = require('express');

var app = express();

app.use('/', (req, res) => {
    res.send('working !');
});

app.listen(4000);