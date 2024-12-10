@echo off
echo Instalando libs
pip install -r requirements.txt

echo Iniciando main.py em um novo terminal...
start cmd /k python main.py
start "" "localhost:25565"
