from flask import Flask, render_template, request, jsonify, send_from_directory
from pytube import YouTube
import os
import string
import subprocess
import shutil

app = Flask(__name__)

# Diretório onde os vídeos serão salvos após o download
DOWNLOAD_FOLDER = os.path.join(app.root_path, 'downloads')
# Diretório de saída, na raiz do projeto, para salvar os vídeos finais
OUTPUT_FOLDER = os.path.join(app.root_path, 'output')

# Verifica e cria os diretórios de downloads e output, se necessário
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
    # Remove caracteres não permitidos para nomes de arquivos
    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
    cleaned_filename = ''.join(c for c in filename if c in valid_chars)
    return cleaned_filename

@app.route('/')
def home():
    return render_template('teste.html')
    

@app.route('/get_resolutions', methods=['POST'])
def get_resolutions():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'Missing URL'}), 400
    
    try:
        yt = YouTube(url)
        # Get all video streams
        video_streams = yt.streams.filter(only_video=True).order_by('resolution').desc()
        resolutions = {stream.resolution for stream in video_streams if stream.resolution is not None}
        
        return jsonify(list(resolutions))
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
        
        # Define os caminhos para salvar os arquivos de vídeo e áudio
        base_filename = clean_filename(yt.title)
        video_filename = f"{base_filename}_video.mp4"
        audio_filename = f"{base_filename}_audio.mp4"
        output_filename = f"{base_filename}_{resolution}.mp4"

        # Caminhos completos onde os arquivos serão salvos
        video_path = os.path.join(DOWNLOAD_FOLDER, video_filename)
        audio_path = os.path.join(DOWNLOAD_FOLDER, audio_filename)
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        if resolution in ['4320p', '2160p','1440p', '1080p', '480p', '240p', '144p']:  # Condições para resoluções altas
            video_stream = yt.streams.filter(res=resolution, only_video=True, adaptive=True).first()
            audio_stream = yt.streams.filter(only_audio=True, adaptive=True).first()
            video_stream.download(filename=video_filename, output_path=DOWNLOAD_FOLDER)
            audio_stream.download(filename=audio_filename, output_path=DOWNLOAD_FOLDER)
            # Executa o FFmpeg para fazer o merge dos streams
            subprocess.run([
                'ffmpeg',
                '-i', video_path,
                '-i', audio_path,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-strict', 'experimental',
                output_path
            ], check=True)
        else:
            # Para 720p e abaixo, baixa o stream progressivo diretamente
            stream = yt.streams.filter(res=resolution, progressive=True).first()
            stream.download(filename=output_filename, output_path=OUTPUT_FOLDER)

        return jsonify({'filename': output_filename})
    except Exception as e:
        app.logger.error(f'Error downloading video: {str(e)}')
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


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=25565) 
