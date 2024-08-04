import os
import sys
import base64
import json

if len(sys.argv) > 2:
    try:
        output_dir = os.path.join(os.path.expanduser("~"), "Desktop", "music", "thumbnails")
        os.makedirs(output_dir, exist_ok=True)

        temp_file_paths = sys.argv[1]
        song_names = sys.argv[2]
        file_paths_array = temp_file_paths.split(',')
        song_names_array = song_names.split(',')

        print(json.dumps({"message": f"song_names: {song_names}"}))

        if len(file_paths_array) != len(song_names_array):
            raise ValueError("The number of file paths and song names must be the same.")

        for i in range(len(file_paths_array)):
            temp_file_path = file_paths_array[i]
            song_name = song_names_array[i]

            new_file_name = f"{song_name}_thumbnail.jpg"
            new_file_path = os.path.join(output_dir, new_file_name)

            with open(temp_file_path, 'r') as file:
                base64_data = file.read()
                if base64_data.startswith('data:image/jpeg;base64,'):
                    base64_data = base64_data.split(',')[1]

            with open(new_file_path, 'wb') as file:
                file.write(base64.b64decode(base64_data))

            testdata = "temp_file_path",temp_file_path,"song_name",song_name
            #print(json.dumps({"message": f"testdata: {testdata}"}))
            #print(json.dumps({"message": f"Thumbnail saved to: {new_file_path}"}))
            
    except Exception as e:
        print(json.dumps({"error": f"Error: {e}"}))
else:
    print(json.dumps({"error": 'Insufficient arguments provided. Need thumbnail source URLs/paths and song names.'}))
