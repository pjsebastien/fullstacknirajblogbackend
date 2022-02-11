const mongoose = require('mongoose');

mongoose
    .connect('mongodb://127.0.0.1:27017/ousekondor')
    .then(() => console.log('Db connected'))
    .catch(error => console.log('Dd connection failed: ', error.message || error));
