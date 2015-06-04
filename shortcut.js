var express = require('express');

var redis = require("redis"),
    client = redis.createClient();

var app = express();


app.get('/:id', function(req, res) {
    client.select(3, function(err) {
        client.get(req.params.id, function(err, data) {
            console.log(req.params, data);
            if (data !== null) {
                res.redirect(data);
            } else {
                res.status(404)
                    .send('Not found');
            }
        });
    });
});

var server = app.listen(4000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});
