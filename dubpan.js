var express = require('express');
var app = express();


app.post('/upload', function(req, res) {
    res.send('Hello World!');
});


app.use('/', express.static('public'));


var server = app.listen(3000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});
