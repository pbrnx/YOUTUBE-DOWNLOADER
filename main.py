from flask import Flask, render_template, request, jsonify, send_from_directory
from pytube import YouTube
import os
import string
import subprocess
import shutil

app = Flask(__name__)

DOWNLOAD_FOLDER = os.path.join(app.root_path, 'downloads')
OUTPUT_FOLDER = os.path.join(app.root_path, 'output')

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

def clean_directories():
    for folder in [DOWNLOAD_FOLDER]:
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

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_resolutions', methods=['POST'])
def get_resolutions():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'Missing URL'}), 400
    
    try:
        yt = YouTube(url)
        video_streams = yt.streams.filter(only_video=True).order_by('resolution').desc()
        resolutions = {stream.resolution for stream in video_streams if stream.resolution is not None}
        
        video_title = yt.title
        video_thumbnail_url = yt.thumbnail_url
        
        return jsonify({
            'resolutions': list(resolutions),
            'title': video_title,
            'thumbnail_url': video_thumbnail_url
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
        yt = YouTube(url)
        
        base_filename = clean_filename(yt.title)
        video_filename = f"{base_filename}_video.mp4"
        audio_filename = f"{base_filename}_audio.mp4"
        output_filename = f"{base_filename}_{resolution}.mp4"

        video_path = os.path.join(DOWNLOAD_FOLDER, video_filename)
        audio_path = os.path.join(DOWNLOAD_FOLDER, audio_filename)
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        if resolution in ['4320p', '2160p','1440p', '1080p', '480p', '240p', '144p']:  
            video_stream = yt.streams.filter(res=resolution, only_video=True, adaptive=True).first()
            audio_stream = yt.streams.filter(only_audio=True, adaptive=True).first()
            video_stream.download(filename=video_filename, output_path=DOWNLOAD_FOLDER)
            audio_stream.download(filename=audio_filename, output_path=DOWNLOAD_FOLDER)
            subprocess.run([
                'ffmpeg',
                '-y',
                '-i', video_path,
                '-i', audio_path,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-strict', 'experimental',
                output_path
            ], check=True)
        else:
            stream = yt.streams.filter(res=resolution, progressive=True).first()
            stream.download(filename=output_filename, output_path=OUTPUT_FOLDER)

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
        yt = YouTube(url)
        base_filename = clean_filename(yt.title)
        audio_filename = f"{base_filename}_audio.mp4"
        output_filename = f"{base_filename}.mp3"

        audio_path = os.path.join(DOWNLOAD_FOLDER, audio_filename)
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        audio_stream = yt.streams.filter(only_audio=True, adaptive=True).first()
        audio_stream.download(filename=audio_filename, output_path=DOWNLOAD_FOLDER)

        subprocess.run([
            'ffmpeg',
            '-y',
            '-i', audio_path,
            '-q:a', '0',
            '-map', 'a',
            output_path
        ], check=True)

        return jsonify({'filename': output_filename})
    except Exception as e:
        app.logger.error(f'Error downloading audio: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/downloads/<filename>', methods=['GET'])
def download_file(filename):
    safe_filename = clean_filename(filename)
    try:
        response = send_from_directory(OUTPUT_FOLDER, safe_filename, as_attachment=True)
        clean_directories()
        return response
    except FileNotFoundError:
        return 'File not found', 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=25565)
