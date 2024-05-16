@echo off
echo Instalando libs
pip install -r requirements.txt
echo Iniciando clean_up_dir.py em um novo terminal...
start cmd /k python cleanupdir.py
echo Iniciando main.py em um novo terminal...
start cmd /k python main.py
