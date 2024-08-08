import os
import sys
from pytube import YouTube
import json
import time

def download_video(youtube_url, filename, retries=50):
    attempt = 0
    while attempt < retries:
        try:
            yt = YouTube(youtube_url)
            title = yt.title
            print(f"Title: {title}, URL: {youtube_url}", file=sys.stderr)

            # Print available streams for debugging
            streams = yt.streams.filter(only_audio=True)
            print(f"Available streams: {[stream.itag for stream in streams]}", file=sys.stderr)

            # Attempt to get the best available audio stream
            stream = streams.order_by('abr').desc().first()
            if stream is None:
                raise Exception("No suitable audio stream found")

            output_directory = os.path.join(os.path.dirname(__file__), 'musics')
            os.makedirs(output_directory, exist_ok=True)
            stream.download(output_path=output_directory, filename=f"{filename}.mp3")
            return {"message": f"Downloaded {filename} successfully!", "title": title}

        except Exception as e:
            attempt += 1
            if attempt >= retries:
                # Include detailed error information for debugging
                return {"error": f"An error occurred after {retries} attempts: {str(e)}. URL: {youtube_url}"}
            print(f"Attempt {attempt} failed: {str(e)}. Retrying...", file=sys.stderr)
            time.sleep(5)

if len(sys.argv) > 2:
    youtube_url = sys.argv[1]
    filename = sys.argv[2]

    # Call the download function with retry logic
    result = download_video(youtube_url, filename)
    print(json.dumps(result))
else:
    print(json.dumps({"error": 'Insufficient arguments received. Need URL and filename.'}))
