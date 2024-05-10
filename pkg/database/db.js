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
        if (rows.length > 0) {
            return rows[0].Count;
        } else {
            return 0;
        }
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
}

module.exports = LocalDataSource;
