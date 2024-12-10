import os
import argparse
from flask import Flask, render_template, request, jsonify, send_from_directory
import yt_dlp
import string
import shutil
from urllib.parse import quote, unquote

DOWNLOAD_FOLDER = 'downloads'
OUTPUT_FOLDER = 'output'

def create_directories():
    if not os.path.exists(DOWNLOAD_FOLDER):
        os.makedirs(DOWNLOAD_FOLDER)

    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

def clean_directories():
    for folder in [DOWNLOAD_FOLDER, OUTPUT_FOLDER]:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')

def clean_filename(filename):
    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
    cleaned_filename = ''.join(c for c in filename if c in valid_chars)
    return cleaned_filename

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_resolutions', methods=['POST'])
def get_resolutions():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'Missing URL'}), 400

    try:
        ydl_opts = {
            'quiet': True,
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        resolutions = set()
        for format in info['formats']:
            if format.get('vcodec') != 'none':
                resolutions.add(format.get('height', 'unknown'))

        return jsonify({
            'resolutions': sorted(resolutions, reverse=True),
            'title': info.get('title', 'Unknown Title'),
            'thumbnail_url': info.get('thumbnail', '')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['POST'])
def download_video():
    url = request.form.get('url')
    resolution = request.form.get('resolution')
    if not url or not resolution:
        return jsonify({'error': 'Missing data'}), 400

    try:
        with yt_dlp.YoutubeDL({}) as ydl:
            info = ydl.extract_info(url, download=False)

        base_filename = clean_filename(info.get('title', 'video'))
        output_filename = f"{base_filename}_{resolution}.mp4"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        ydl_opts = {
            'format': f'bestvideo[height={resolution}]+bestaudio/best',
            'outtmpl': output_path,
            'quiet': False,
            'merge_output_format': 'mp4',
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        return jsonify({'filename': output_filename})
    except Exception as e:
        app.logger.error(f'Error downloading video: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/download_audio', methods=['POST'])
def download_audio():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'Missing URL'}), 400

    try:
        with yt_dlp.YoutubeDL({}) as ydl:
            info = ydl.extract_info(url, download=False)

        base_filename = clean_filename(info.get('title', 'audio'))
        output_filename = f"{base_filename}.mp3"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        return jsonify({'filename': output_filename})
    except Exception as e:
        app.logger.error(f'Error downloading audio: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/downloads/<filename>', methods=['GET'])
def download_file(filename):
    try:
        decoded_filename = unquote(filename)
        response = send_from_directory(OUTPUT_FOLDER, decoded_filename, as_attachment=True)
        return response
    except FileNotFoundError:
        return 'File not found', 404

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--create-dirs', action='store_true', help='Create necessary directories')
    parser.add_argument('--port', type=int, default=25565, help='Port to run the server')
    args = parser.parse_args()

    if args.create_dirs:
        create_directories()
    else:
        port = args.port or int(os.getenv('PORT', 25565))
        create_directories()
        app.run(host='0.0.0.0', port=port)
