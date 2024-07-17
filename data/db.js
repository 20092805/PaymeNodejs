const mysql = require("mysql");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


db.connect((err) => {
    if (err) {
        console.log("MySql connection error:", err);
    } else {
        console.log("MySql connected successfully");
        initializeDatabase();
    }
});

const initializeDatabase = () => {
    db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.log("Error creating database:", err);
            return;
        }
        console.log("Database created or already exists");
        db.changeUser({ database: process.env.DB_NAME }, (err) => {
            if (err) {
                console.log("Error switching database:", err);
                return;
            }

            const createUserTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    password TEXT NOT NULL,
                    username TEXT NOT NULL,
                    fullName TEXT NOT NULL,
                    dateOfBirth DATE NOT NULL,
                    phoneNumber VARCHAR(20) NOT NULL,
                    address TEXT NOT NULL,
                    gender ENUM('male', 'female') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            db.query(createUserTableQuery, (err) => {
                if (err) {
                    console.log("Error creating table:", err);
                } else {
                    console.log("Table created or already exists");
                }
            });
        });
    });
};

module.exports = db;