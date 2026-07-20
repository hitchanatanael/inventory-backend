const express = require('express');

const exampleController = require('../controllers/exampleController');

const router = express.Router();

router.get('/', exampleController.getExamples);

module.exports = router;
