var express = require('express');
var http = require('http');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { 
		title: 'Blackjack' 
	});
});



module.exports = router;
