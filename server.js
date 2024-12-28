const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const transactionRoutes = require('./routes/transactionRoutes');
const dotenv = require('dotenv');

const app = express();
const port = 5001;

mongoose.connect("mongodb+srv://manshus23csai:Manshu%40786@cluster0.r64pw.mongodb.net/roxiler?retryWrites=true&w=majority&appName=Cluster0", {
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

app.use('/api', transactionRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
