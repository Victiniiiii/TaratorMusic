import os
import sys
from pytube import YouTube
import json
import time

if len(sys.argv) > 2:
    youtube_url = sys.argv[1]
    filename = sys.argv[2]
    attempt = 0
    retries = 3
    while attempt < retries:
        try:
            yt = YouTube(youtube_url)
            title = yt.title
            output_directory = os.path.expanduser("~/Desktop/music/musics")
            output_directory = os.path.join(os.path.dirname(__file__), 'musics')
            yt.streams.filter(only_audio=True).first().download(output_path=output_directory, filename=f"{filename}.mp3")
        except Exception as e:
            attempt += 1
            time.sleep(30)
else:
    print(json.dumps({"error": 'Insufficient arguments received. Need URL and filename.'}))
