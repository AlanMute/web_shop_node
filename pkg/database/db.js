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
        return rows[0].total || 0;
    }

}

module.exports = LocalDataSource;
