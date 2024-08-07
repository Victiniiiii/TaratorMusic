import os
import sys
from pytube import YouTube
import json # Downloads Youtube song

if len(sys.argv) > 2:
    try:
        youtube_url = sys.argv[1]
        filename = sys.argv[2]

        yt = YouTube(youtube_url)
        title = yt.title

        output_directory = os.path.join(os.path.dirname(__file__), 'musics')
        yt.streams.filter(only_audio=True).first().download(output_path=output_directory, filename=f"{filename}.mp3")
        print(json.dumps({"message": f"Downloaded {filename} successfully!", "title": title}))
        
    except Exception as e:
        print(json.dumps({"error": f"An error occurred: {str(e)}."})) 
else:
    print(json.dumps({"error": 'Insufficient arguments received. Need URL and filename.'}))