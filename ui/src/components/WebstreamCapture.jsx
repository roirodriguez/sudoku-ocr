import React, { useState } from 'react';
import Webcam from "react-webcam";

const videoConstraints = {
  facingMode: "environment",
  autoFocus: 'continuous',
  flashMode: 'off',
  whiteBalance: 'continuous',
  zoom: 0,
  focusDepth: 0
};

export default () => {
  const [cap,setCap] = useState(null);
  const webcamRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [cvReady, setCvReady] = useState(false);
  const capture = React.useCallback(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      setCap(imageSrc);
    },
    [webcamRef]
  );

  // Ajustar tamaño de canvas según el video
  const syncCanvasSize = () => {
    const webcamVideo = webcamRef.current && webcamRef.current.video;
    const overlay = canvasRef.current;
    if (!webcamVideo || !overlay) return;

    const w = webcamVideo.videoWidth || webcamVideo.clientWidth;
    const h = webcamVideo.videoHeight || webcamVideo.clientHeight;

    // Ajusta tamaños en píxeles reales
    overlay.width = w;
    overlay.height = h;

    // también ajusta estilos CSS para que el overlay cubra el contenedor
    overlay.style.width = `${webcamVideo.clientWidth}px`;
    overlay.style.height = `${webcamVideo.clientHeight}px`;
  };

  // Cuando el video empiece a reproducirse, sincroniza tamaños
  const handleUserMedia = () => {
      setTimeout(syncCanvasSize, 50); // pequeña demora para que los atributos videoWidth/videoHeight estén disponibles
  };

  return (
    <>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        autoPlay={true}
        videoConstraints={videoConstraints}
        disablePictureInPicture={true}
        forceScreenshotSourceSize={true}
        onLoad={() => console.log("onLoad")}
        onUserMedia={handleUserMedia}
      />
      <canvas ref={canvasRef}></canvas>

      <button onClick={capture}>Capture photo</button>
      <img src={cap} />
    </>
  );
};