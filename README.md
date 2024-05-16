# Personal Project
## Youtube Video Downloader

This app has a python backend using the lib pytube to download videos directly from youtube lib. In order to use it, download FFMPEG essential and add it to windows path. Youtube only makes 360p and 720p videos with audio and video stream on a single file. For any other, including lower resolutions, the FFMPEG converter will be needed to gather the Video+Audio file that will be stored temporarily on the download folder.

Run the command **'pip install -r requirements.txt'** to install the necessary libraries for the application to run (FFPMEG needs to be downloaded on the official website https://ffmpeg.org/download.html)

The application will be accessible on your public IP or on localhost using the port 25565. To make it accessible on onther devices, port forward the port 25565 on your router for both TCP and UDP protocols. Also, release this port on windows firewall.

The batch file Will automatically start all the dependencies required to run the application correctly.


## In app use:
### Insert the video URL and click on 'Search Youtube Video'
![image](https://github.com/pbrnx/YOUTUBE-DOWNLOADER/assets/128100284/b53a8be6-5029-4ba8-8bf7-df26d7d0f813)

### Python will handle the HTTP requests and fetch the resolution and other video information:
![image](https://github.com/pbrnx/YOUTUBE-DOWNLOADER/assets/128100284/2d0416bc-9483-49cd-8d4c-89dd272fc782)

### Select the resolution and click on 'Download'
![image](https://github.com/pbrnx/YOUTUBE-DOWNLOADER/assets/128100284/c25faa9f-42db-4b8b-914b-67352d9b682f)






