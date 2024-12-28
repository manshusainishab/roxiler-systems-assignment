const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
  sold: { type: Boolean, required: true },
  dateOfSale: { type: Date, required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
