import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  facingMode: "environment",
  autoFocus: 'continuous',
  flashMode: 'off',
  whiteBalance: 'continuous',
  zoom: 0,
  focusDepth: 0,
  //aspectRatio: ratio,
};

export default function WebcamWithOpenCVOverlay({
    rectWidthPercent = 0.5, // ancho del rectángulo como fracción del ancho del video
    rectHeightPercent = 0.3, // alto como fracción del alto del video
    strokeThickness = 4, // grosor del borde
    strokeColor = [255, 0, 0, 255], // RGBA del rectángulo (OpenCV usa BGR por defecto cuando trabaja con Mats)
}) {
    const webcamRef = useRef(null);
    const overlayRef = useRef(null); // canvas donde mostraremos la salida (cv.imshow)
    const offscreenRef = useRef(null); // canvas para copiar el frame del video
    const requestRef = useRef(null);
    const [cvReady, setCvReady] = useState(false);

    // Cargar OpenCV.js dinámicamente si no está ya presente
    useEffect(() => {
        if (window.cv) {
            setCvReady(true);
            return;
        }
        const script = document.createElement("script");
        // URL estable: la documentación oficial provee opencv.js. Puedes cambiar la versión si quieres.
        script.src = "https://docs.opencv.org/4.x/opencv.js";
        script.async = true;
        script.onload = () => {
            // OpenCV se inicializa y expone `cv`. Esperamos a que esté listo.
            // Si usas versiones donde cv.onRuntimeInitialized existe, usarlo para detectar disponibilidad.
            if (window.cv && typeof window.cv.onRuntimeInitialized === "function") {
                window.cv.onRuntimeInitialized = () => setCvReady(true);
            } else {
                setCvReady(true);
            }
        };
        script.onerror = (e) => {
            console.error("Error al cargar OpenCV.js", e);
        };
        document.body.appendChild(script);

        return () => {
            // cleanup opcional: no quitamos el script porque podría romper otros componentes
        };
    }, []);

    // Ajustar tamaño de canvas según el video
    const syncCanvasSize = () => {
        const webcamVideo = webcamRef.current && webcamRef.current.video;
        const overlay = overlayRef.current;
        const off = offscreenRef.current;
        if (!webcamVideo || !overlay || !off) return;

        const w = webcamVideo.videoWidth || webcamVideo.clientWidth;
        const h = webcamVideo.videoHeight || webcamVideo.clientHeight;

        // Ajusta tamaños en píxeles reales
        overlay.width = w;
        overlay.height = h;
        off.width = w;
        off.height = h;

        // también ajusta estilos CSS para que el overlay cubra el contenedor
        overlay.style.width = `${webcamVideo.clientWidth}px`;
        overlay.style.height = `${webcamVideo.clientHeight}px`;
    };

    // Loop de procesamiento con OpenCV
    useEffect(() => {
        if (!cvReady) return;
console.log("loop procesamiento opencv");
        const process = () => {
            const videoEl = webcamRef.current && webcamRef.current.video;
            const overlayCanvas = overlayRef.current;
            const offscreenCanvas = offscreenRef.current;
            if (!videoEl || !overlayCanvas || !offscreenCanvas) {
                requestRef.current = requestAnimationFrame(process);
                return;
            }
            // Sincroniza tamaño si cambió
            syncCanvasSize();

            const w = offscreenCanvas.width;
            const h = offscreenCanvas.height;
            if (w === 0 || h === 0) {
                requestRef.current = requestAnimationFrame(process);
                return;
            }

            const offCtx = offscreenCanvas.getContext("2d");
            offCtx.drawImage(videoEl, 0, 0, w, h);

            // Obtener imageData y construir Mat
            const imageData = offCtx.getImageData(0, 0, w, h);
            const src = window.cv.matFromImageData(imageData);

            // Dibuja sobre src (nota: src está en RGBA en el mat)
            // Convertir a BGR si quieres dibujar con colores BGR usando cv.rectangle (no estrictamente necesario)
            // Para simplicidad usaremos cv.rectangle en un Mat RGBA: OpenCV.js acepta el color en forma [R,G,B,A]

            // Calcula rectángulo centrado
            const rectW = Math.round(w * rectWidthPercent);
            const rectH = Math.round(h * rectHeightPercent);
            const x1 = Math.round((w - rectW) / 2);
            const y1 = Math.round((h - rectH) / 2);
            const x2 = x1 + rectW;
            const y2 = y1 + rectH;

            // Dibujo (OpenCV rectangle espera color en formato [R,G,B,A] para RGBA mats)
            const color = new window.cv.Scalar(strokeColor[0], strokeColor[1], strokeColor[2], strokeColor[3]);
            window.cv.rectangle(src, new window.cv.Point(x1, y1), new window.cv.Point(x2, y2), color, strokeThickness);

            // Mostramos en overlayCanvas usando cv.imshow
            try {
                window.cv.imshow(overlayCanvas, src);
            } catch (err) {
                // si hay error en imshow, fallback a dibujar con 2D context
                const outCtx = overlayCanvas.getContext("2d");
                outCtx.putImageData(imageData, 0, 0);
                outCtx.strokeStyle = `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3] / 255})`;
                outCtx.lineWidth = strokeThickness;
                outCtx.strokeRect(x1, y1, rectW, rectH);
            }

            // liberar memoria de Mats
            src.delete();

            // siguiente frame
            requestRef.current = requestAnimationFrame(process);
        };

        // arrancar el loop
        requestRef.current = requestAnimationFrame(process);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        };
    }, [cvReady, rectWidthPercent, rectHeightPercent, strokeThickness, strokeColor]);

    // Cuando el video empiece a reproducirse, sincroniza tamaños
    const handleUserMedia = () => {
        setTimeout(syncCanvasSize, 50); // pequeña demora para que los atributos videoWidth/videoHeight estén disponibles
    };

    return (
        <div className="relative w-full max-w-xl mx-auto p-4">
        <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black">
        {/* Webcam video */}
        <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            autoPlay={true}
            videoConstraints={videoConstraints}
            disablePictureInPicture={true}
            forceScreenshotSourceSize={true}
            onUserMedia={handleUserMedia}
        />

        {/* Canvas overlay: posicion absoluto, cubre el video */}
        <canvas ref={overlayRef} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} />


        {/* Offscreen canvas (oculto) para copiar el frame del video antes de convertirlo a Mat */}
        <canvas ref={offscreenRef} style={{ display: "none" }} />
        </div>


        <div className="mt-3 text-sm text-gray-600">
        <div>OpenCV status: {cvReady ? "cargado" : "cargando..."}</div>
        <div className="mt-1">Rectángulo centrado: {Math.round(rectWidthPercent * 100)}% × {Math.round(rectHeightPercent * 100)}%</div>
        </div>
        </div>
    );
}
