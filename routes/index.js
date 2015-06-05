var express = require('express');
var router = express.Router();
var YouTube = require('youtube-node');
var request = require('request');
var process = require('child_process');
var async = require('async');

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
  console.log(req.query.track);
  if (req.query.track) getYouTubeVideoId(req.query.track, function(err, videoId) {
    if (!err) downloadYouTubeVideo(videoId, function(err, result) {
      if (!err) res.send(err);
      else res.send(result);
    });
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

function downloadYouTubeVideo(videoId, fn) {
  // download video and convert to mp3
  process.exec('youtube-dl --extract-audio --audio-format=mp3 https://www.youtube.com/watch?v=' + videoId, function callback(error, stdout, stderr) {
    fn(null, stdout);
  });
}

module.exports = router;
