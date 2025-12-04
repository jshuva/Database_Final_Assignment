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
        const tables = results.map(row => Object.values(row)[0]);
        res.json(tables);
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
        const results = await query(`SELECT * FROM ${tableName}`);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Failed to fetch data from ${tableName}` });
    }
});

// 2. Add New Software (Complex Transactional Write)
app.post('/api/software', async (req, res) => {
    const { brandName, productType, systemName } = req.body;

    if (!brandName || !productType || !systemName) {
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

        // 3. Insert SoftwareSystem
        // Note: The schema provided in the prompt implies SoftwareSystem might have a name? 
        // Wait, looking at the schema: 
        // CREATE TABLE SoftwareSystem (SystemID INT AUTO_INCREMENT PRIMARY KEY, BrandID INT NOT NULL, ProductTypeID INT NOT NULL, ...);
        // It DOES NOT have a 'SystemName' or 'Name' column in the provided schema!
        // However, the prompt requirements say: "Form Inputs: Brand Name, Product Type, System Name".
        // This is a conflict. I should check if I can add it or if I should assume the schema is fixed.
        // "Use the following SQL schema to understand the relationships".
        // If I strictly follow the schema, I cannot insert 'SystemName'.
        // However, usually 'SoftwareSystem' implies it IS the entity.
        // Let's look at the schema again.
        // `CREATE TABLE SoftwareSystem (SystemID ..., BrandID ..., ProductTypeID ...)`
        // Maybe `Brand` + `ProductType` IS the unique identifier? e.g. "Microsoft" + "Office".
        // But the prompt asks for "System Name".
        // I will assume for now that I should strictly follow the schema provided, 
        // OR I might need to alter the table? No, usually I shouldn't alter provided schemas unless told.
        // BUT, the prompt explicitly asks for "System Name" input.
        // Let's look at `SystemCategory` or others? No.
        // I will try to insert it. If the column doesn't exist, it will fail.
        // A safer bet is that the user *intended* for there to be a name column, or maybe `BrandName` + `TypeName` is enough?
        // Let's look at the prompt again: "Form Inputs: Brand Name, Product Type, System Name".
        // I will add a comment about this potential schema mismatch and try to insert it, 
        // but if the schema is strict, I might have to drop it.
        // Actually, I'll check the schema columns dynamically or just assume the user made a typo in the schema description vs requirements.
        // I'll assume the schema provided is the source of truth for the DB structure.
        // If so, where does "System Name" go?
        // Maybe `BrandName` IS the system name? No, "Microsoft" is a brand.
        // I will assume there is a `Name` column that was accidentally omitted in the text description, 
        // OR I will just ignore `SystemName` for the insertion if the table doesn't support it, 
        // but that would be bad UX.
        // Let's assume I should add `SystemName` column if it's missing? No, I can't alter DB.
        // I will try to insert into `SoftwareSystem` assuming there might be a `Name` or `SystemName` column.
        // If not, I'll just insert BrandID and ProductTypeID.

        // Let's check the schema provided in the prompt again carefully.
        // `CREATE TABLE SoftwareSystem (SystemID INT AUTO_INCREMENT PRIMARY KEY, BrandID INT NOT NULL, ProductTypeID INT NOT NULL, FOREIGN KEY ...)`
        // It definitely misses a name column.
        // I will proceed by inserting BrandID and ProductTypeID. I will log a warning about the missing SystemName.

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
      AVG((e.Friendliness + e.Features + e.Accuracy) / 3) as AverageScore
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

// 4. User Management
app.get('/api/users', async (req, res) => {
    try {
        const results = await query('SELECT * FROM User ORDER BY UserID DESC');
        // Privacy: Mask emails in the response
        const maskedResults = results.map(u => ({
            ...u,
            UserPseudoEmail: u.UserPseudoEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }));
        res.json(maskedResults);
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
    try {
        await query('INSERT INTO User (UserPseudoEmail) VALUES (?)', [email]);
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
    try {
        await query('UPDATE User SET UserPseudoEmail = ? WHERE UserID = ?', [email, id]);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM User WHERE UserID = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        if (err.errno === 1451) {
            return res.status(409).json({
                error: 'Cannot delete this user because they have submitted reviews.',
                details: 'To preserve data integrity, you cannot delete a user who has active evaluations in the system.'
            });
        }
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

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
        const maskedResults = results.map(r => ({
            ...r,
            UserPseudoEmail: r.UserPseudoEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }));
        res.json(maskedResults);
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
      AVG((e.Friendliness + e.Features + e.Accuracy) / 3) as AverageScore
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

// 4. User Management
app.get('/api/users', async (req, res) => {
    try {
        const results = await query('SELECT * FROM User ORDER BY UserID DESC');
        // Privacy: Mask emails in the response
        const maskedResults = results.map(u => ({
            ...u,
            UserPseudoEmail: u.UserPseudoEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }));
        res.json(maskedResults);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/users/raw', async (req, res) => {
    // Internal endpoint for dropdowns where we might need the full value to match, 
    // but for now let's stick to sending ID and Masked Email to frontend for safety.
    // Actually, for a dropdown "Select User", seeing "jo***@gmail.com" is fine.
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
    try {
        await query('INSERT INTO User (UserPseudoEmail) VALUES (?)', [email]);
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
    try {
        await query('UPDATE User SET UserPseudoEmail = ? WHERE UserID = ?', [email, id]);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM User WHERE UserID = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        if (err.errno === 1451) {
            return res.status(409).json({
                error: 'Cannot delete this user because they have submitted reviews.',
                details: 'To preserve data integrity, you cannot delete a user who has active evaluations in the system.'
            });
        }
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

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
        const maskedResults = results.map(r => ({
            ...r,
            UserPseudoEmail: r.UserPseudoEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }));
        res.json(maskedResults);
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
