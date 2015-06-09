var express = require('express')
  , router = express.Router()
  , YouTube = require('youtube-node')
  , request = require('request')
  , process = require('child_process')
  , async = require('async')

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/current-track', function(req, res, next) {
  getCurrentTrack(req.query.channel_id, function(err, songName) {
    if (!err) res.send(songName);
  });
});

router.get('/playlists', function(req, res, next) {
  getPlaylists(function(err, playlists) {
    if (!err) res.send(playlists);
  });
});

router.get('/download-track', function(req, res) {
  var track = req.query.track;
  if (!validateTrack(track))
    res.end();

  if (track) getYouTubeVideoId(track, function(err, videoId) {
    if (!err) downloadYouTubeVideo(videoId);
  });
  res.end();
});

function getPlaylists(cb) {
  request('http://listen.di.fm/public3', function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var playlists = [];
      var channels = JSON.parse(body);
      
      async.each(channels, function(channel, fn) {
        request(channel.playlist, function(err, res, body) {
          if (!err && res.statusCode == 200) {
            var streamRegExp = /File\d=([^\n]+)/;
            var streams = body.match(streamRegExp);
            playlists.push({'title': channel.name, 'mp3': streams[1], 'id': channel.id});
            fn();
          }
        });
      }, function(err) {
        //called when all done, or error occurs
        playlists.sort(function(a, b) {
          if (a.title > b.title) return 1;
          if (a.title < b.title) return -1;
          return 0;
        });
        cb(null, playlists);
      });
    }
  });
}

function validateTrack(track) {
    if (track == '')
        return false;
}

function getCurrentTrack(channel_id, fn) {
// trance.fm
//  var options = {
//    url: 'http://ch01a.320.trance.fm/7.html',
//    headers: {
//      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0'
//    }
//  };
//  request(options, function(err, res, body) {
//    if (!err && res.statusCode == 200) {
//      var csvStreamInfo = body.split('<body>').pop().replace('</body></html>', '');
//      var delimeter = ',';
//      var tokens = csvStreamInfo.split(delimeter).slice(6);
//      var songName = tokens.join(delimeter);
//      fn(null, songName);
//    } else {
//      fn(err);
//    }
//  });
  request('http://api.audioaddict.com/v1/di/track_history', function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var jsonObj = JSON.parse(body);
      track = jsonObj[channel_id].track;
      fn(null, track); 
    }
  });
}

function getYouTubeVideoId(songName, fn) {
  var youTube = new YouTube();
  var maxResults = 1;
  youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');
	youTube.search(songName, maxResults, function(err, res) {
    if (err) fn(err);
    else fn(null, res.items[0].id.videoId)
  });
}

var downloading = new Object();

function downloadYouTubeVideo(videoId) {
  if (videoId in downloading) {
      return;
  }
  // download video and convert to mp3
  var proc = process.exec('youtube-dl --extract-audio --audio-format=mp3 -o \'./public/downloads/%(title)s.%(ext)s\' ' + videoId, function callback(error, stdout, stderr) {
    delete downloading[videoId];
  });
  downloading[videoId] = proc;
}

module.exports = router;
