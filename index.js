const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const LocalDataSource = require('./pkg/database/db');
const SessionManager = require('./pkg/session/manager');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Alan123231',
    database: 'shopdb'
});

const promisePool = pool.promise();
const dataSource = new LocalDataSource(promisePool);

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
    const sessionId = req.cookies ? req.cookies['sessionId'] : null;
    
    if (sessionId) {
        const user = SessionManager.getSession(sessionId);
        if (user) {
            req.user = user;
        }
    }

    next();
});

app.get('/', async (req, res) => {
    const user = req.user;
    let cartCount = 0;
    try {
        if (user) {
            cartCount = await dataSource.getCartCount(user.UserID);
        }
        const products = await dataSource.getProducts();
        res.render('index', { products, user, cartCount });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Произошла ошибка при получении данных');
    }
});

app.get('/search', async (req, res) => {
    const searchQuery = req.query.query || '';

    try {
        const products = await dataSource.getProducts(searchQuery);
        res.json(products);
    } catch (error) {
        console.error('Ошибка при выполнении запроса поиска:', error);
        res.status(500).json({ error: 'Произошла ошибка при поиске товаров' });
    }
});


app.get('/login', async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Произошла ошибка при получении данных');
    }
});

app.post('/login-obr', async (req, res) => {
    const { username, password } = req.body;
    const user = await dataSource.getUserByUsername(username);

    if (user && user.Password == password) {
        sessionId = user.UserID;
        SessionManager.setSession(sessionId, user);

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            path: '/',
        });
        
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/register-obr', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await dataSource.getUserByUsername(username);

    if (existingUser) {
        res.json({ success: false });
    } else {
        await dataSource.createUser(username, password);
        res.json({ success: true });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
