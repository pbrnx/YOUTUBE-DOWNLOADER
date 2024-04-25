import os
import shutil
import schedule
import time

OUTPUT_FOLDER = 'output'

def clean_output_directory():
    print(f"Iniciando a limpeza da pasta: {OUTPUT_FOLDER}")
    for filename in os.listdir(OUTPUT_FOLDER):
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
                print(f"Arquivo removido: {file_path}")
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
                print(f"Pasta removida: {file_path}")
        except Exception as e:
            print(f'Falha ao deletar {file_path}. Motivo: {e}')
    print(f"Limpeza concluída para a pasta: {OUTPUT_FOLDER}")

clean_output_directory()
schedule.every(1).minutes.do(clean_output_directory)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(1)
        
