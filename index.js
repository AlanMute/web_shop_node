const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const LocalDataSource = require('./pkg/database/db');
const SessionManager = require('./pkg/session/manager');
const cookieParser = require('cookie-parser');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Alan123231',
    database: 'shopdb'
});

const promisePool = pool.promise();
const dataSource = new LocalDataSource(promisePool);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
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

app.get('/cart', async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const user = req.user

    try {
        const cartItems = await dataSource.getCartItems(user.UserID);
        cartCount = await dataSource.getCartCount(user.UserID);

        let totalPrice = 0;
        for (const item of cartItems) {
            totalPrice += item.Price * item.Quantity;
        }

        res.render('cart', {
            user: req.user,
            cartItems,
            totalPrice,
            cartCount,
        });
    } catch (error) {
        console.error('Ошибка при получении данных о корзине:', error);
        res.status(500).send('Ошибка сервера');
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

app.post('/cart/add', async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const user = req.user;

        if (!user) {
            return res.json({
                success: false,
                redirect: "/login",
            });
        }

        const addResult = await dataSource.addToCart(user.UserID, product_id, quantity);

        if (addResult.success) {
            const cartCount = await dataSource.getCartCount(user.UserID);
            remainingCount = await dataSource.getProductStock(product_id);

            return res.json({
                success: true,
                cartCount: cartCount,
                remainingCount: remainingCount,
            });
        } else {
            return res.status(400);
        }
    } catch (error) {
        console.error('Ошибка при добавлении товара в корзину:', error);
        return res.status(500);
    }
});

app.post('/cart/remove', async (req, res) => {
    const { product_id } = req.body;

    if (!req.user) {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    const userId = req.user.UserID;

    try {
        await dataSource.removeCartItem(userId, product_id);
        const cartCount = await dataSource.getCartCount(userId);
        const totalPrice = await dataSource.getCartTotalPrice(userId);
        console.log(cartCount, totalPrice)
        return res.status(200).json({
            success: true,
            cartCount: cartCount,
            totalPrice: totalPrice,
        });
    } catch (error) {
        console.error('Ошибка при удалении товара из корзины:', error);
        return res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/cart/buy', async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }
    const userId = req.user.UserID;

    try {
        await dataSource.buyProducts(userId)
        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error('Ошибка при покупке товара:', error);
        return res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
