@echo off
echo Instalando libs
pip install -r requirements.txt

echo Iniciando main.py novo terminal...
python main.py
start "" "http://y2down.ddns.net:25565"

