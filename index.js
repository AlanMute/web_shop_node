const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const LocalDataSource = require('./pkg/database/db');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Alan123231',
    database: 'shopdb'
});

const promisePool = pool.promise();
const dataSource = new LocalDataSource(promisePool);

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', async (req, res) => {
    const category_id = req.query.category_id ? parseInt(req.query.category_id, 10) : -1;
    const search = req.query.search || '';

    try {
        const products = await dataSource.getProducts(category_id, search);

        res.render('index', { products });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Произошла ошибка при получении данных');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
