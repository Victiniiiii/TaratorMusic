import sys
import os
from pytube import Playlist
from pytube import YouTube # Downloads Youtube playlist videos

if len(sys.argv) > 2:
    try:
        video_titles = sys.argv[1]
        playlist_url = sys.argv[2]    
        output_directory = os.path.join(os.path.expanduser("~"), "Desktop", "music", "musics")

        titles_to_download = video_titles.split(',')
        playlist = Playlist(playlist_url)
        playlist_length = len(playlist.videos)
        
        for i in range(playlist_length):
            title = titles_to_download[i].strip()
            video = playlist.videos[i]        
            videourl = video.watch_url
            yt = YouTube(videourl)
            video.streams.filter(only_audio=True).first().download(output_path=output_directory, filename=f"{title}.mp3")
        print("Playlist successfully downloaded!")
    except Exception as e:
        print(({"error": f"Error: {e}"}))
else: 
    print("Error, not enough arguments.")
