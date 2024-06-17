# Coubs Downloader
The Coubs downloader is a simple API and html interface for downloading coub from a website coub.com 

## Available options: 
**Video+Audio** - downloads a video as long as the video sequence itself and shortens the audio to match its length. \
**Audio+Video** - downloads a video long in the audio sequence and duplicates the video until the audio sequence ends. \
**Audio** - only audio sequence. \
**Video** - video sequence only. \
**Fixed Video*2+Audio** - downloads a video with a length of 2 video sequences and shortens the audio to match its length. 

## API:
The API is sent to the entry point /api post request and has only 2 parameters: {url:String, type:String} where url is the link to the source video for download, type is the type of video received (video, audio, fix2vid, audVid, vidAud)

## Config:
The entire config is duplicated by env and listed below
```json
{
    "useRequestQueue": true,
    "requestQueueLength": 10,
    "port": 14080
}
```
```env
QUEUE = true
QUEUE_LENGTH = 10
PORT = 14080
```




![Site Screenshot](/front/img/coubscreen.png)
