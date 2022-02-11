const express = require('express');
require('dotenv').config();
require('express-async-errors');
require('./db');
const morgan = require('morgan');
const postRouter = require('./routers/post');
const cors = require('cors');

const app = express();

app.use(express.json());

//Si l'on veut donner accès à un seul reseau local
// app.use(cors({ origin: 'http://localhost:3000' }));
//Si l'on donne accès a tout
app.use(cors());
app.use(morgan('dev'));
app.use('/api/post', postRouter);
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log('port is listening on ' + PORT);
});
