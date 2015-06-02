var express = require('express');
var multer = require('multer');
var childProcess = require('child_process');

var app = express();

app.use(multer({
    dest: '/tmp/'
}))
app.use('/', express.static('public'));

app.post('/upload', function(req, res) {
    var conProc = childProcess.exec('ffmpeg -y -i public/videos/' + req.body.video + '.webm -i ' + req.files.sound.path + ' -vcodec copy /tmp/test.webm', function(error, stdout, stderr) {

        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        }
    });
    conProc.on('exit', function(code) {
        console.log("done");
        childProcess.exec('rm -f ' + req.files.sound.path, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
                console.log('Signal received: ' + error.signal);
            }
        });
        res.json({
            success: true
        });
    });
});


var server = app.listen(3000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});
