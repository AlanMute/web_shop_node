class LocalDataSource {
    constructor(pool) {
        this.pool = pool;
    }

    async getProducts(search = '') {
        let sql = 'SELECT * FROM Products';
        let values = [];

        if (search) {
            sql += ' WHERE Name LIKE ?';
            values.push(`%${search}%`);
        }

        try {
            const [results] = await this.pool.query(sql, values);
            return results;
        } catch (error) {
            console.error('Ошибка получения продуктов:', error);
            throw error;
        }
    }

    async getUserByUsername(username) {
        try {
            const [rows] = await this.pool.query('SELECT * FROM Users WHERE Login = ?', [username]);

            if (rows.length > 0) {
                return rows[0];
            } else {
                return null;
            }
        } catch (error) {
            console.error('Ошибка при получении пользователя по имени пользователя:', error);
            throw error;
        }
    }

    async createUser(username, password) {
        try {
            await this.pool.query('INSERT INTO Users (Login, Password) VALUES (?, ?)', [username, password]);
        } catch (error) {
            console.error('Ошибка при получении пользователя по имени пользователя:', error);
            throw error;
        }
    }

    async getCartCount(userId) {
        const query = `SELECT SUM(Quantity) AS TotalItems FROM Cart WHERE UserID = ?`;
        const [rows] = await this.pool.execute(query, [userId]);
        return rows[0].TotalItems || 0;
    }

    async addToCart(userId, productId, quantity) {
        try {
            const stockData = await this.getProductStock(productId);
            const stockCount = stockData ? stockData.Count : 0;

            if (quantity > stockCount) {
                return {
                    success: false,
                    message: 'У нас столько нет, вы чего?',
                };
            }

            const cartItem = await this.getCartItem(userId, productId);

            if (cartItem) {
                await this.updateCartQuantity(userId, productId, quantity);
            } else {
                await this.addCartItem(userId, productId, quantity);
            }

            await this.updateProductStock(productId, quantity);

            const remainingCount = await this.getProductStock(productId);

            return {
                success: true,
                remainingCount,
            };
        } catch (error) {
            console.error('Ошибка при добавлении товара в корзину:', error);
            return {
                success: false,
                message: 'Ошибка при добавлении товара в корзину',
            };
        }
    }

    async getCartItem(userId, productId) {
        try {
            const query = 'SELECT * FROM Cart WHERE UserID = ? AND ProductID = ?';
            const [result] = await this.pool.execute(query, [userId, productId]);

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('Ошибка при получении товара из корзины:', error);
            throw error;
        }
    }

    async getProductStock(productId) {
        const query = 'SELECT Count FROM Products WHERE ProductID = ?';
        const [rows] = await this.pool.query(query, [productId]);

        return rows[0].Count || 0;
    }

    async updateCartQuantity(userId, productId, quantity) {
        const query = 'UPDATE Cart SET Quantity = Quantity + ? WHERE UserID = ? AND ProductID = ?';
        await this.pool.execute(query, [quantity, userId, productId]);
    }

    async addCartItem(userId, productId, quantity) {
        const query = 'INSERT INTO Cart (UserID, ProductID, Quantity) VALUES (?, ?, ?)';
        await this.pool.execute(query, [userId, productId, quantity]);
    }

    async updateProductStock(productId, quantity) {
        const query = 'UPDATE Products SET Count = Count - ? WHERE ProductID = ?';
        await this.pool.execute(query, [quantity, productId]);
    }

    async getCartItems(userId) {
        const query = `
        SELECT Products.ProductID, Products.Name, Products.Price, Cart.Quantity
        FROM Cart
        INNER JOIN Products ON Cart.ProductID = Products.ProductID
        WHERE Cart.UserID = ?`;
        const [rows] = await this.pool.query(query, [userId]);
        return rows;
    }

    async removeCartItem(userId, productId) {
        let query_to_total = 'SELECT Quantity FROM Cart WHERE UserID = ? AND ProductID = ?';
        const [rows] = await this.pool.execute(query_to_total, [userId, productId]);
        const quantity = rows[0].Quantity

        await this.pool.execute('UPDATE Products SET Count = Count + ? WHERE ProductID = ?', [quantity, productId]);

        const query = 'DELETE FROM Cart WHERE UserID = ? AND ProductID = ?';
        await this.pool.execute(query, [userId, productId]);
    }

    async getCartTotalPrice(userId) {
        const query = `
        SELECT SUM(Products.Price * Cart.Quantity) AS totalPrice
        FROM Cart
        INNER JOIN Products ON Cart.ProductID = Products.ProductID
        WHERE Cart.UserID = ?`;
        const [rows] = await this.pool.query(query, [userId]);
        return rows[0].totalPrice || 0;
    }

    async buyProducts(userId) {
        const query = 'DELETE FROM Cart WHERE UserID = ?';
        await this.pool.execute(query, [userId]);
    }

    async sendFeedBack(userId, email, subject, message) {
        const query = 'INSERT INTO Feedback (UserID, Email, Subject, Message) VALUES (?, ?, ?, ?)';
        try {
        await this.pool.execute(query, [userId, email, subject, message]);
        } catch (error) {
            console.error('Ошибка при получении пользователя по имени пользователя:', error);
            throw error;
        }
    }

    async deleteProduct(product_id) {
        const cartQuery = 'DELETE FROM Cart WHERE ProductID = ?';
        const delQuery = 'DELETE FROM Products WHERE ProductID = ?';
        try {
            await this.pool.execute(cartQuery, [product_id]);
            await this.pool.execute(delQuery, [product_id]);
        } catch (error) {
            console.error('Ошибка при получении пользователя по имени пользователя:', error);
            throw error;
        }
    }
}

module.exports = LocalDataSource;
