const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const LocalDataSource = require('./pkg/database/db');
const SessionManager = require('./pkg/session/manager');
const cookieParser = require('cookie-parser');
const { error } = require('console');

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
        let isAdmin = false;
        if (user) {
            cartCount = await dataSource.getCartCount(user.UserID);
            isAdmin = user.Login === 'admin';
        }
        const products = await dataSource.getProducts();
        res.render('index', { products, user, isAdmin, cartCount, productsJson: JSON.stringify(products) });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).send('Произошла ошибка при получении данных');
    }
});


app.get('/get-all-products', async (req, res) => {
    try {
        const products = await dataSource.getProducts();
        res.status(200).json(products);
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

app.get('/profile', async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    cartCount = await dataSource.getCartCount(req.user.UserID);
    const isAdmin = req.user.Login === 'admin';
    const username = req.user.Login;

    res.render('profile', { isAdmin, username, cartCount });
});

app.get('/admin-panel', async (req, res) => {
    if (!req.user || req.user.Login !== 'admin') {
        return res.redirect('/');
    }

    user = req.user
    res.render('admin-panel', { user });
});

app.get('/get-all-feedback', async (req, res) => {
    if (!req.user || req.user.Login !== 'admin') {
        return res.redirect('/');
    }

    try {
        const feedbacks = await dataSource.getFeedbacks()
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Ошибка при получении фидбэков:', error);
        res.status(500).json({ error: 'Ошибка при получении фидбэков' });
    }
});

app.post('/login-obr', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Не заполнены все поля' });
    }

    const user = await dataSource.getUserByUsername(username);

    if (user && user.Password == password) {
        sessionId = user.UserID;
        SessionManager.setSession(sessionId, user);

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000,
            path: '/',
        });
        
        res.status(200).json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'Неверный логин или пароль!'});
    }
});

app.post('/register-obr', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Не заполнены все поля!' });
    }
    const existingUser = await dataSource.getUserByUsername(username);

    if (existingUser) {
        res.status(200).json({ success: false, error: 'Пользователь с таким именем уже существует!'});
    } else {
        await dataSource.createUser(username, password);
        res.status(400).json({ success: true });
    }
});

app.post('/cart/add', async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!quantity) {
            return res.status(400).json({ success: false, error: 'Не заполнены все поля!' });
        }
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
            return res.status(400).json({ success: false, error: 'Ошибка при добавлении товара в корзину:' });
        }
    } catch (error) {
        console.error('Ошибка при добавлении товара в корзину:', error);
        return res.status(500).json({ success: false, error: 'Ошибка при добавлении товара в корзину:' });
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

app.post('/logout-obr', async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    const userId = req.user.UserID;

    SessionManager.deleteSession(userId)
    res.clearCookie('sessionId');
    res.status(200).json({ success: true, message: 'Вы успешно вышли из учетной записи' });
});

app.post('/feedback/send', async (req, res) => {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
        return res.status(400).json({ success: false, error: 'Не заполнены все поля!' });
    }

    if (!req.user) {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }
    const userId = req.user.UserID;

    try {
        await dataSource.sendFeedBack(userId, email, subject, message);

        res.status(200).json({ success: true, message: 'Обратная связь успешно отправлена' });
    } catch (error) {
        console.error('Ошибка при отправке обратной связи:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/delete_product', async (req, res) => {
    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({ success: false, error: 'Продукта нет.' });
    }

    if (!req.user || req.user.Login !== 'admin') {
        return res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    try {
        await dataSource.deleteProduct(product_id);

        res.status(200).json({ success: true, message: 'Удаление прошло успешно' });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/add-product', async (req, res) => {
    const { name, price, image, description, count } = req.body;

    if (!name || !price || !image || !description || !count) {
        return res.status(400).json({ success: false, error: 'Заполнены не все поля!' });
    }

    if (!req.user || req.user.Login !== 'admin') {
        return res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    try {
        await dataSource.addProduct(name, price, image, description, count);
        res.status(200).json({ success: true, message: 'Добавление товара прошло успешно' });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/ed-product', async (req, res) => {
    const { product_id, name, price, image, description, count } = req.body;

    if (!product_id || !name || !price || !image || !description || !count) {
        return res.status(400).json({ success: false, error: 'Заполнены не все поля!' });
    }

    if (!req.user || req.user.Login !== 'admin') {
        return res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    try {
        await dataSource.updProduct(name, price, image, description, count, product_id);
        res.status(200).json({ success: true, message: 'Изменение товара прошло успешно' });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/del-feedback', async (req, res) => {
    const { feedbackId } = req.body;
    
    if (!feedbackId) {
        return res.status(400).json({ success: false, error: 'Фидбэка нет' });
    }

    if (!req.user || req.user.Login !== 'admin') {
        return res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }

    try {
        await dataSource.delFeedback(feedbackId);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении фидбэка:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});


app.use(async (req, res, next) => {
    user = req.user
    cartCount = 0
    if (user) {
        cartCount = await dataSource.getCartCount(user.UserID);
    }
    res.status(404).render('notFound', {user, cartCount});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
