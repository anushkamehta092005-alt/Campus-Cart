const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors());app.use(express.json());

// ✅ DB Connection (ONLY ONCE)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'campus_cart'
});
db.connect(err => {
    if (err) {
        console.log(err);
    } else {
        console.log("MySQL Connected");
    }
});
// ✅ API
app.get('/products', (req, res) => {
    console.log("Fetching products...");

    db.query("SELECT * FROM products", (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error");
        }

        if (!result) {
            return res.send("No data found");
        }

        res.json(result);
    });
});
app.post('/add-product', (req, res) => {
    const { name, price, stock } = req.body;

    const sql = "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)";

    db.query(sql, [name, price, stock], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error adding product");
        }

        res.send("Product added successfully");
    });
});
app.post('/sale', (req, res) => {
    const { product_id, quantity } = req.body;

    db.query("SELECT * FROM products WHERE id = ?", [product_id], (err, result) => {
        if (err) return res.send(err);

        const product = result[0];

        if (!product || product.stock < quantity) {
            return res.send("Not enough stock");
        }

        const total = product.price * quantity;

        db.query(
            "INSERT INTO sales (product_id, quantity, total_price) VALUES (?, ?, ?)",
            [product_id, quantity, total],
            (err) => {
                if (err) return res.send(err);

                db.query(
                    "UPDATE products SET stock = stock - ? WHERE id = ?",
                    [quantity, product_id],
                    (err) => {
                        if (err) return res.send(err);

                        res.send("Sale recorded");
                    }
                );
            }
        );
    });
});
app.get('/revenue', (req, res) => {
    db.query("SELECT SUM(total_price) AS revenue FROM sales", (err, result) => {
        if (err) return res.send(err);

        res.json(result);
    });
});
app.get('/top-products', (req, res) => {
    db.query(`
        SELECT products.name, SUM(sales.quantity) AS total_sold
        FROM sales
        JOIN products ON sales.product_id = products.id
        GROUP BY sales.product_id
        ORDER BY total_sold DESC
        LIMIT 5
    `, (err, result) => {
        if (err) return res.send(err);

        res.json(result);
    });
});
app.get('/low-stock', (req, res) => {
    db.query("SELECT * FROM products WHERE stock < 10", (err, result) => {
        if (err) return res.send(err);

        res.json(result);
    });
});
// ✅ Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});