const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.get('/transactions', async (req, res) => {
  const { page = 1, perPage = 10, search = '' } = req.query;

  const isNumberSearch = !isNaN(search) && search.trim() !== '';

  try {
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
      if (isNumberSearch) {
        filter.$or.push({ price: parseFloat(search) });
      }
    }
    const transactions = await Transaction.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions', error });
  }
});


router.get('/statistics', async (req, res) => {
  const { month } = req.query;

  const monthMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const monthNumber = monthMap[month];

  if (!monthNumber) {
    return res.status(400).json({ error: 'Invalid month name' });
  }

  try {
    const statistics = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: {$cond: [{ $eq: ['$sold', true] }, '$price', 0]} },
          totalSold: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } },
          totalNotSold: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } }
        }
      }
    ]);

    res.json(statistics[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});


router.get('/bar-chart', async (req, res) => {
  const { month } = req.query;

  const monthMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const monthNumber = monthMap[month];
  
  try {
    const priceRanges = [
      [0, 100], [101, 200], [201, 300], [301, 400], [401, 500],
      [501, 600], [601, 700], [701, 800], [801, 900], [901, 'above']
    ];

    const barChartData = await Promise.all(priceRanges.map(async (range) => {
      const match = range[1] === 'above' ? { $gt: range[0] } : { $gte: range[0], $lte: range[1] };
      const result = await Transaction.countDocuments({
        price: match,
        $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
      });
      return { range: `${range[0]}-${range[1] === 'above' ? 'Above' : range[1]}`, count: result };
    }));

    res.json(barChartData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bar chart data' , error});
  }
});

router.get('/pie-chart', async (req, res) => {
  const { month } = req.query;

  const monthMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const monthNumber = monthMap[month];
  try {
    const categories = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pie chart data' });
  }
});

router.get('/combined', async (req, res) => {
  const { month } = req.query;

  const monthMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const monthNumber = monthMap[month];

  try {
    const statistics = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: {$cond: [{ $eq: ['$sold', true] }, '$price', 0]} },
          totalSold: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } },
          totalNotSold: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } }
        }
      }
    ]);

    const priceRanges = [
      [0, 100], [101, 200], [201, 300], [301, 400], [401, 500],
      [501, 600], [601, 700], [701, 800], [801, 900], [901, 'above']
    ];

    const barChart = await Promise.all(priceRanges.map(async (range) => {
      const match = range[1] === 'above' ? { $gt: range[0] } : { $gte: range[0], $lte: range[1] };
      const result = await Transaction.countDocuments({
        price: match,
        $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
      });
      return { range: `${range[0]}-${range[1] === 'above' ? 'Above' : range[1]}`, count: result };
    }));

    const pieChart = await Transaction.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statistics: statistics[0] || {},
      barChart,
      pieChart
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching combined data' });
  }
});

module.exports = router;
