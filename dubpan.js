var express = require('express');
var multer = require('multer');
var childProcess = require('child_process');
var app = express();
var cred = require('./credential');
var readline = require('readline');
var google = require("googleapis"),
  yt = google.youtube('v3'),
  fs = require("fs");

var redis = require("redis"),
  client = redis.createClient();

var oauth2Client = new google.auth.OAuth2(global.clientId, global.appSecret, global.redirectUrl);

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: "https://www.googleapis.com/auth/youtube.upload" // If you only need one scope you can pass it as string
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var tokens;
try {
  tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
  console.log("tokens loaded");
} catch (e) {

  console.log('Visit the url: ', url);
  rl.question('Enter the code here:', function(code) {
    oauth2Client.getToken(code, function(err, ttokens) {
      tokens = ttokens;
      console.log(err, ttokens);
      fs.writeFile('./tokens.json', JSON.stringify(tokens), function(err) {
        if (err) return console.log(err);
        console.log("tokens saved");
      });
    });
  });
}

function uploadToYoutube(video_file, title, description, callback) {
  var oauth2Client = new google.auth.OAuth2(global.clientId, global.appSecret, global.redirectUrl);
  oauth2Client.setCredentials(tokens);
  google.options({
    auth: oauth2Client
  });
  return yt.videos.insert({
    part: 'status,snippet',
    resource: {
      snippet: {
        title: title,
        description: description
      },
      status: {
        privacyStatus: 'unlisted' //if you want the video to be private
      }
    },
    media: {
      body: fs.createReadStream(video_file)
    }
  }, function(error, data) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, data.id);
    }
  });

};

function pad(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

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
      childProcess.exec('rm -f ' + req.files.sound.path, function(error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
          console.log('Signal received: ' + error.signal);
        }
      });
      client.select(3, function(err) {
          client.incr("dpcount", function(err, dpcount) {
              var dpid = "um" + pad(dpcount, 4);
              uploadToYoutube("/tmp/test.webm", "#" + dpcount + " Parle avec elles", "Réalisé dans le cadre du Mois des femmes 2016 organisé par la Direction Vie des campus de l'Université de Montpellier.\ninstallation interactive tactile doublage vidéo développé par David Olivari.\nDu 7 mars au 7 avril 2016 à la fontaine numérique - (S) pace - Campus Triolet.
                ", function(err, data) {
                client.set(dpid, "https://www.youtube.com/watch?v=" + data, function(err, ret) {
                  console.log("done yt upload", err, dpid, "https://www.youtube.com/watch?v=" + data);
                });

              });

            var conProc = childProcess.exec('cp /tmp/test.webm /home/cde/Dropbox/videoum/' + dpid + '.webm', function(error, stdout, stderr) {
              res.json({
                success: true,
                dpid: dpid
              });
            });
          });
      });
  });
});


var server = app.listen(3000, function() {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
