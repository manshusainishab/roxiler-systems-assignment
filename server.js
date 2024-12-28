const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const Transaction = require('./models/Transaction');
const transactionRoutes = require('./routes/transactionRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

mongoose.connect(process.env.DATABASEURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

async function initializeDatabase() {
  try {
    const count = await Transaction.countDocuments();
    if (count > 0) {
      console.log('Database already initialized.');
      return;
    }

    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const data = response.data;

    const transactions = data.map(item => ({
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      sold: item.sold,
      dateOfSale: new Date(item.dateOfSale),
    }));

    await Transaction.insertMany(transactions);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-domain.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use('/api', transactionRoutes);

app.listen(port, () => {
  console.log(`Server is running on https://roxiler-systems-assignment-nb2f.onrender.com:${port}`);
});
