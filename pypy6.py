import os
import sys
import base64
import json # Downloads Youtube songs thumbnail

if len(sys.argv) > 2:
    try:
        temp_file_path = sys.argv[1]
        download_second_input_value = sys.argv[2]

        output_dir = os.path.join(os.path.expanduser("~"), "Desktop", "music", "thumbnails")
        os.makedirs(output_dir, exist_ok=True)
        new_file_name = f"{download_second_input_value}_thumbnail.jpg"
        new_file_path = os.path.join(output_dir, new_file_name)

        with open(temp_file_path, 'r') as file:
            base64_data = file.read()
            if base64_data.startswith('data:image/jpeg;base64,'):
                base64_data = base64_data.split(',')[1]

        with open(new_file_path, 'wb') as file:
            file.write(base64.b64decode(base64_data))
        
        print(json.dumps({"message": f"Thumbnail saved to: {new_file_path}"}))
    except Exception as e:
        print(json.dumps({"error": f"Error: {e}"}))
else:
    print(json.dumps({"error": 'Insufficient arguments provided. Need thumbnail source URL/path and input value.'}))