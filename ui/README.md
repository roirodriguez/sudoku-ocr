# README

## Misc

### Arrancar webcam virtual

Primero instalar el módulo de kernel [v4l2loopback](https://github.com/v4l2loopback/v4l2loopback). En la mayoría de distribuciones hay paquetes, incluyendo v4l2loopback-utils (instalar este también). Hecho esto:

```bash
# comando con todas las opciones, consultar github
$ sudo modprobe v4l2loopback devices=1 card_label="v4l2loop virt webcam" video_nr=1 exclusive_caps=1
$ v4l2-ctl --list-devices
v4l2loop virt webcam (platform:v4l2loopback-001):
	/dev/video1
$ ffmpeg -stream_loop -1 -re -i video.mp4 -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video1
```

El último comando envía en bucle video.mp4 a /dev/video1.