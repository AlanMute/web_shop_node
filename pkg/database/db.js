class LocalDataSource {
    constructor(pool) {
        this.pool = pool;
    }

    async getProducts(category_id = -1, search = '') {
        let sql = 'SELECT * FROM Products';
        let values = [];

        if (category_id !== -1 || search) {
            sql += ' WHERE';

            if (category_id !== -1) {
                sql += ' CategoryID = ?';
                values.push(category_id);
            }

            if (search) {
                if (category_id !== -1) {
                    sql += ' AND';
                }
                sql += ' Name LIKE ?';
                values.push(`%${search}%`);
            }
        }

        try {
            const [results] = await this.pool.query(sql, values);
            return results;
        } catch (error) {
            console.error('Ошибка получения продуктов:', error);
            throw error;
        }
    }
}

module.exports = LocalDataSource;
