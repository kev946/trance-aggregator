# Need to get youtube-dl
sudo curl https://yt-dl.org/downloads/2015.05.15/youtube-dl -o /usr/local/bin/youtube-dl
sudo chmod 755 /usr/local/bin/youtube-dl

# Need ffmpeg for mp3 conversion
sudo add-apt-repository ppa:mc3man/trusty-media
sudo apt-get update
sudo apt-get install ffmpeg
