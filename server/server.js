const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { query, getTransactionConnection } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Dynamic Table Viewer - List Tables
app.get('/api/tables', async (req, res) => {
    try {
        const results = await query('SHOW TABLES');
        const allTables = results.map(row => Object.values(row)[0]);

        // Filter out tables with 0 rows
        const nonEmptyTables = [];
        for (const table of allTables) {
            // Use a safe query to get count
            const [countResult] = await query(`SELECT COUNT(*) as count FROM ${table}`);
            if (countResult.count > 0) {
                nonEmptyTables.push(table);
            }
        }

        res.json(nonEmptyTables);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

// 1. Dynamic Table Viewer - Get Table Data
app.get('/api/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    // Basic SQL injection prevention: ensure tableName only contains alphanumeric/underscores
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
        // Order by the first column (usually ID) descending to show newest first
        const results = await query(`SELECT * FROM ${tableName} ORDER BY 1 DESC`);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Failed to fetch data from ${tableName}` });
    }
});

// 1b. Get All Product Types (for dropdown)
app.get('/api/product-types', async (req, res) => {
    try {
        const results = await query('SELECT * FROM ProductType ORDER BY TypeName ASC');
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch product types' });
    }
});

// 2. Add New Software (Complex Transactional Write)
app.post('/api/software', async (req, res) => {
    const { brandName, productType } = req.body;

    if (!brandName || !productType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await getTransactionConnection();

    try {
        await conn.promise().beginTransaction();

        // 1. Handle Brand
        let brandId;
        const [brands] = await conn.promise().query('SELECT BrandID FROM Brand WHERE BrandName = ?', [brandName]);
        if (brands.length > 0) {
            brandId = brands[0].BrandID;
        } else {
            const [brandResult] = await conn.promise().query('INSERT INTO Brand (BrandName) VALUES (?)', [brandName]);
            brandId = brandResult.insertId;
        }

        // 2. Handle ProductType
        let typeId;
        const [types] = await conn.promise().query('SELECT ProductTypeID FROM ProductType WHERE TypeName = ?', [productType]);
        if (types.length > 0) {
            typeId = types[0].ProductTypeID;
        } else {
            const [typeResult] = await conn.promise().query('INSERT INTO ProductType (TypeName) VALUES (?)', [productType]);
            typeId = typeResult.insertId;
        }

        // 3. Check for Duplicate (Brand + ProductType)
        const [existingSoftware] = await conn.promise().query(
            'SELECT SystemID FROM SoftwareSystem WHERE BrandID = ? AND ProductTypeID = ?',
            [brandId, typeId]
        );

        if (existingSoftware.length > 0) {
            await conn.promise().rollback();
            return res.status(409).json({
                error: 'Duplicate Entry',
                details: `The software "${brandName} - ${productType}" already exists in the database.`
            });
        }

        // 4. Insert SoftwareSystem
        await conn.promise().query('INSERT INTO SoftwareSystem (BrandID, ProductTypeID) VALUES (?, ?)', [brandId, typeId]);

        await conn.promise().commit();
        res.json({ message: 'Software added successfully', systemId: typeId }); // Returning ID
    } catch (err) {
        await conn.promise().rollback();
        console.error(err);
        res.status(500).json({ error: 'Transaction failed', details: err.message });
    }
});

// 2b. List All Software (Read for CRUD)
app.get('/api/software', async (req, res) => {
    try {
        const sql = `
            SELECT ss.SystemID, b.BrandName, pt.TypeName
            FROM SoftwareSystem ss
            JOIN Brand b ON ss.BrandID = b.BrandID
            JOIN ProductType pt ON ss.ProductTypeID = pt.ProductTypeID
            ORDER BY ss.SystemID DESC
        `;
        const results = await query(sql);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch software list' });
    }
});

// 2c. Update Software (Update for CRUD)
app.put('/api/software/:id', async (req, res) => {
    const { id } = req.params;
    const { brandName, productType } = req.body;

    if (!brandName || !productType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await getTransactionConnection();

    try {
        await conn.promise().beginTransaction();

        // 1. Handle Brand
        let brandId;
        const [brands] = await conn.promise().query('SELECT BrandID FROM Brand WHERE BrandName = ?', [brandName]);
        if (brands.length > 0) {
            brandId = brands[0].BrandID;
        } else {
            const [brandResult] = await conn.promise().query('INSERT INTO Brand (BrandName) VALUES (?)', [brandName]);
            brandId = brandResult.insertId;
        }

        // 2. Handle ProductType
        let typeId;
        const [types] = await conn.promise().query('SELECT ProductTypeID FROM ProductType WHERE TypeName = ?', [productType]);
        if (types.length > 0) {
            typeId = types[0].ProductTypeID;
        } else {
            const [typeResult] = await conn.promise().query('INSERT INTO ProductType (TypeName) VALUES (?)', [productType]);
            typeId = typeResult.insertId;
        }

        // 3. Update SoftwareSystem
        await conn.promise().query('UPDATE SoftwareSystem SET BrandID = ?, ProductTypeID = ? WHERE SystemID = ?', [brandId, typeId, id]);

        await conn.promise().commit();
        res.json({ message: 'Software updated successfully' });
    } catch (err) {
        await conn.promise().rollback();
        console.error(err);
        res.status(500).json({ error: 'Transaction failed', details: err.message });
    }
});

// 2d. Delete Software (Delete for CRUD)
app.delete('/api/software/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM SoftwareSystem WHERE SystemID = ?', [id]);
        res.json({ message: 'Software deleted successfully' });
    } catch (err) {
        console.error(err);
        // MySQL Error 1451: Cannot delete or update a parent row: a foreign key constraint fails
        if (err.errno === 1451) {
            return res.status(409).json({
                error: 'Cannot delete this software because it has related data (e.g., Evaluations).',
                details: 'Foreign Key Constraint Failed. If you want to delete this, you must delete the related data first or ensure ON DELETE CASCADE is enabled in your database.'
            });
        }
        res.status(500).json({ error: 'Failed to delete software' });
    }
});

// 3. Analytics: Top-Rated Software
app.get('/api/analytics/top', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    const strictSql = `
    SELECT 
      ss.SystemID,
      b.BrandName,
      pt.TypeName,
      AVG((e.Friendliness + e.Features + e.Accuracy) / 3) as AverageScore,
      COUNT(e.EvaluationID) as ReviewCount
    FROM SoftwareSystem ss
    JOIN Brand b ON ss.BrandID = b.BrandID
    JOIN ProductType pt ON ss.ProductTypeID = pt.ProductTypeID
    JOIN Evaluation e ON ss.SystemID = e.SystemID
    GROUP BY ss.SystemID, b.BrandName, pt.TypeName
    ORDER BY AverageScore DESC
    LIMIT ?
  `;

    try {
        const results = await query(strictSql, [limit]);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// 3b. Analytics: Market Insights & Projections
app.get('/api/analytics/insights', async (req, res) => {
    try {
        const insights = {};

        // 1. Best Brand (Highest Avg Score across all their software)
        const brandSql = `
            SELECT b.BrandName, AVG((e.Friendliness + e.Features + e.Accuracy) / 3) as AvgScore
            FROM Brand b
            JOIN SoftwareSystem ss ON b.BrandID = ss.BrandID
            JOIN Evaluation e ON ss.SystemID = e.SystemID
            GROUP BY b.BrandID
            ORDER BY AvgScore DESC
            LIMIT 1
        `;
        const [bestBrand] = await query(brandSql);
        insights.bestBrand = bestBrand || null;

        // 2. Top Category (Highest Avg Score)
        const topCatSql = `
            SELECT pt.TypeName, AVG((e.Friendliness + e.Features + e.Accuracy) / 3) as AvgScore
            FROM ProductType pt
            JOIN SoftwareSystem ss ON pt.ProductTypeID = ss.ProductTypeID
            JOIN Evaluation e ON ss.SystemID = e.SystemID
            GROUP BY pt.ProductTypeID
            ORDER BY AvgScore DESC
            LIMIT 1
        `;
        const [topCategory] = await query(topCatSql);
        insights.topCategory = topCategory || null;

        // 3. Most Popular Category (Most reviews)
        const catSql = `
            SELECT pt.TypeName, COUNT(e.EvaluationID) as ReviewCount
            FROM ProductType pt
            JOIN SoftwareSystem ss ON pt.ProductTypeID = ss.ProductTypeID
            JOIN Evaluation e ON ss.SystemID = e.SystemID
            GROUP BY pt.ProductTypeID
            ORDER BY ReviewCount DESC
            LIMIT 1
        `;
        const [popularCategory] = await query(catSql);
        insights.popularCategory = popularCategory || null;

        // 4. Total Reviews
        const [totalReviews] = await query('SELECT COUNT(*) as count FROM Evaluation');
        console.log('Total Reviews Raw:', totalReviews);
        insights.totalReviews = totalReviews ? totalReviews.count : 0;

        // 5. Market Average Score
        const [marketAvg] = await query('SELECT AVG((Friendliness + Features + Accuracy) / 3) as avg FROM Evaluation');
        console.log('Market Avg Raw:', marketAvg);
        insights.marketAverage = marketAvg ? marketAvg.avg : 0;

        // 6. Attribute Averages (for Radar/Bar Chart)
        const [attrAvg] = await query(`
            SELECT 
                AVG(Friendliness) as Friendliness,
                AVG(Price) as Price,
                AVG(Features) as Features,
                AVG(Accuracy) as Accuracy
            FROM Evaluation
        `);
        insights.attributeAverages = attrAvg || { Friendliness: 0, Price: 0, Features: 0, Accuracy: 0 };

        // 7. Score Distribution (for Bar Chart)
        // We'll group by rounded average score
        const distSql = `
            SELECT 
                FLOOR((Friendliness + Features + Accuracy) / 3) as ScoreRange,
                COUNT(*) as Count
            FROM Evaluation
            GROUP BY ScoreRange
            ORDER BY ScoreRange
        `;
        const distribution = await query(distSql);
        // Normalize to ensure we have keys for 0-10
        const distMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
        distribution.forEach(d => {
            if (distMap[d.ScoreRange] !== undefined) distMap[d.ScoreRange] = d.Count;
        });
        insights.scoreDistribution = distMap;

        // 8. Category Distribution (for Pie Chart)
        const catDistSql = `
            SELECT pt.TypeName as name, COUNT(e.EvaluationID) as value
            FROM ProductType pt
            JOIN SoftwareSystem ss ON pt.ProductTypeID = ss.ProductTypeID
            JOIN Evaluation e ON ss.SystemID = e.SystemID
            GROUP BY pt.ProductTypeID
        `;
        const catDist = await query(catDistSql);
        insights.categoryDistribution = catDist;

        console.log('Final Insights Object:', insights);
        res.json(insights);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

const crypto = require('crypto');

// Helper to hash email
const hashEmail = (email) => {
    return crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);
};

// ... (existing code)

// 4. User Management
app.get('/api/users', async (req, res) => {
    try {
        const results = await query('SELECT * FROM User ORDER BY UserID DESC');
        // No need to mask, it's already a hash
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/users/raw', async (req, res) => {
    try {
        const results = await query('SELECT UserID, UserPseudoEmail FROM User ORDER BY UserID DESC');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const pseudoEmail = hashEmail(email);

    try {
        await query('INSERT INTO User (UserPseudoEmail) VALUES (?)', [pseudoEmail]);
        res.json({ message: 'User added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to add user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const pseudoEmail = hashEmail(email);

    try {
        await query('UPDATE User SET UserPseudoEmail = ? WHERE UserID = ?', [pseudoEmail, id]);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ... (delete user endpoint remains same)

// 5. Evaluation (Review) Management
app.get('/api/evaluations', async (req, res) => {
    try {
        const sql = `
            SELECT e.EvaluationID, e.Friendliness, e.Price, e.Features, e.Accuracy, e.EvaluationTimestamp,
                   b.BrandName, pt.TypeName, u.UserPseudoEmail, e.SystemID, e.UserID
            FROM Evaluation e
            JOIN SoftwareSystem ss ON e.SystemID = ss.SystemID
            JOIN Brand b ON ss.BrandID = b.BrandID
            JOIN ProductType pt ON ss.ProductTypeID = pt.ProductTypeID
            JOIN User u ON e.UserID = u.UserID
            ORDER BY e.EvaluationTimestamp DESC
            LIMIT 50
        `;
        const results = await query(sql);
        // No need to mask, it's already a hash
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch evaluations' });
    }
});

app.post('/api/evaluations', async (req, res) => {
    const { systemId, userId, friendliness, price, features, accuracy } = req.body;

    if (!systemId || !userId || !friendliness || !features || !accuracy) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await query(
            'INSERT INTO Evaluation (SystemID, UserID, Friendliness, Price, Features, Accuracy) VALUES (?, ?, ?, ?, ?, ?)',
            [systemId, userId, friendliness, price || 0, features, accuracy]
        );
        res.json({ message: 'Review submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

app.put('/api/evaluations/:id', async (req, res) => {
    const { id } = req.params;
    const { friendliness, price, features, accuracy } = req.body;
    try {
        await query(
            'UPDATE Evaluation SET Friendliness = ?, Price = ?, Features = ?, Accuracy = ? WHERE EvaluationID = ?',
            [friendliness, price, features, accuracy, id]
        );
        res.json({ message: 'Review updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update review' });
    }
});

app.delete('/api/evaluations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM Evaluation WHERE EvaluationID = ?', [id]);
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// 2b. List All Software (Read for CRUD)
app.get('/api/software', async (req, res) => {
    try {
        const sql = `
            SELECT ss.SystemID, b.BrandName, pt.TypeName
            FROM SoftwareSystem ss
            JOIN Brand b ON ss.BrandID = b.BrandID
            JOIN ProductType pt ON ss.ProductTypeID = pt.ProductTypeID
            ORDER BY ss.SystemID DESC
        `;
        const results = await query(sql);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch software list' });
    }
});

// 2c. Update Software (Update for CRUD)
app.put('/api/software/:id', async (req, res) => {
    const { id } = req.params;
    const { brandName, productType } = req.body;

    if (!brandName || !productType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await getTransactionConnection();

    try {
        await conn.promise().beginTransaction();

        // 1. Handle Brand (Smart Update)
        // Check current brand of this software
        const [currentSoftware] = await conn.promise().query('SELECT BrandID FROM SoftwareSystem WHERE SystemID = ?', [id]);
        let newBrandId;

        if (currentSoftware.length > 0) {
            const currentBrandId = currentSoftware[0].BrandID;

            // Check how many software systems use this brand
            const [brandUsage] = await conn.promise().query('SELECT COUNT(*) as count FROM SoftwareSystem WHERE BrandID = ?', [currentBrandId]);
            const isExclusiveBrand = brandUsage[0].count === 1;

            // Check if the target brand name already exists
            const [existingBrands] = await conn.promise().query('SELECT BrandID FROM Brand WHERE BrandName = ?', [brandName]);

            if (isExclusiveBrand && existingBrands.length === 0) {
                // Scenario A: Brand is only used by this software AND new name doesn't exist.
                // We can safely rename the brand itself (Cascading Update effect).
                await conn.promise().query('UPDATE Brand SET BrandName = ? WHERE BrandID = ?', [brandName, currentBrandId]);
                newBrandId = currentBrandId;
            } else {
                // Scenario B: Brand is shared OR new name already exists.
                // We must link to the existing/new brand, leaving the old one alone (for other software).
                if (existingBrands.length > 0) {
                    newBrandId = existingBrands[0].BrandID;
                } else {
                    const [brandResult] = await conn.promise().query('INSERT INTO Brand (BrandName) VALUES (?)', [brandName]);
                    newBrandId = brandResult.insertId;
                }
            }
        } else {
            // Fallback if software not found (shouldn't happen given the flow)
            const [brands] = await conn.promise().query('SELECT BrandID FROM Brand WHERE BrandName = ?', [brandName]);
            if (brands.length > 0) {
                newBrandId = brands[0].BrandID;
            } else {
                const [brandResult] = await conn.promise().query('INSERT INTO Brand (BrandName) VALUES (?)', [brandName]);
                newBrandId = brandResult.insertId;
            }
        }

        // 2. Handle ProductType
        let typeId;
        const [types] = await conn.promise().query('SELECT ProductTypeID FROM ProductType WHERE TypeName = ?', [productType]);
        if (types.length > 0) {
            typeId = types[0].ProductTypeID;
        } else {
            const [typeResult] = await conn.promise().query('INSERT INTO ProductType (TypeName) VALUES (?)', [productType]);
            typeId = typeResult.insertId;
        }

        // 3. Update SoftwareSystem
        await conn.promise().query('UPDATE SoftwareSystem SET BrandID = ?, ProductTypeID = ? WHERE SystemID = ?', [newBrandId, typeId, id]);

        await conn.promise().commit();
        res.json({ message: 'Software updated successfully' });
    } catch (err) {
        await conn.promise().rollback();
        console.error(err);
        res.status(500).json({ error: 'Transaction failed', details: err.message });
    }
});

// 2d. Delete Software (Delete for CRUD)
app.delete('/api/software/:id', async (req, res) => {
    const { id } = req.params;
    const conn = await getTransactionConnection();
    try {
        await conn.promise().beginTransaction();

        // Cascade Delete: Delete related evaluations first
        await conn.promise().query('DELETE FROM Evaluation WHERE SystemID = ?', [id]);

        // Then delete the software
        await conn.promise().query('DELETE FROM SoftwareSystem WHERE SystemID = ?', [id]);

        await conn.promise().commit();
        res.json({ message: 'Software and related reviews deleted successfully' });
    } catch (err) {
        await conn.promise().rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to delete software' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
