import os
from pytube import YouTube

try:
    yt = YouTube("https://www.youtube.com/watch?v=cdwal5Kw3Fc")
    audio_stream = yt.streams.filter(only_audio=True).first()
    user_desktop = os.path.join(os.path.expanduser("~"), "Desktop", "music")
    audio_file_path = os.path.join(user_desktop, f"{yt.title}.mp3")
    audio_stream.download(output_path=user_desktop, filename=f"{yt.title}.mp3")
    print("Audio downloaded successfully!")
    os.remove(audio_file_path)
    print("Audio file deleted successfully!")
    
except Exception as e:
    print(f"An error occurred: {str(e)}")
