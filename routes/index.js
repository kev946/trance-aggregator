var express = require('express');
var router = express.Router();
var YouTube = require('youtube-node');
var request = require('request');
var process = require('child_process');

router.get('/', function(req, res, next) {
  getSongName(function(err, songName) {
    if (!err) res.render('index', { title: 'Trance Aggregator', song: songName });
  });
});

router.post('/', function(req, res) {
  if (req.body.song) getSongNameYouTubeVideoId(req.body.song, function(err, videoId) {
    if (!err) downloadConvertVideoIdToMp3(videoId, function(err, result) {
      if (!err) res.send(err);
      else res.send(result);
    });
  });
});

function getSongName(fn) {
  var options = {
    url: 'http://ch01a.320.trance.fm/7.html',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0'
    }
  };
  request(options, function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var csvStreamInfo = body.split('<body>').pop().replace('</body></html>', '');
      var delimeter = ',';
      var start = 6;
      var tokens = csvStreamInfo.split(delimeter).slice(start);
      var songName = tokens.join(delimeter);
      fn(null, songName);
    } else {
      fn(err);
    }
  });
}

function getSongNameYouTubeVideoId(songName, fn) {
  var youTube = new YouTube();
  var maxResults = 1;
  youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');
	youTube.search(songName, maxResults, function(err, res) {
    if (err) fn(err);
    else fn(null, res.items[0].id.videoId)
  });
}

function downloadConvertVideoIdToMp3(videoId, fn) {
  process.exec('youtube-dl --extract-audio --audio-format=mp3 https://www.youtube.com/watch?v=' + videoId, function callback(error, stdout, stderr) {
    fn(null, stdout);
  });
}

module.exports = router;
