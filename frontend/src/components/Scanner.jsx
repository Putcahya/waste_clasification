import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

const Scanner = () => {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error'|'info', message }
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result || null);
    reader.readAsDataURL(f);
  };

  const showNotice = (message, type = "info", duration = 4000) => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), duration);
  };

  const handleProcess = async () => {
    if (!file && !image) return showNotice("Pilih gambar dulu!", "error");
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("image", file);
      } else {
        // convert dataURL to blob
        const res = await fetch(image);
        const blob = await res.blob();
        formData.append("image", blob, "capture.png");
      }

      const resp = await fetch("https://wasteclasification-production.up.railway.app/predict", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      setPrediction(data.prediction ?? data.label ?? "Unknown");
      setConfidence(typeof data.confidence === "number" ? (data.confidence * 100).toFixed(2) : data.confidence);
      showNotice("Berhasil memproses gambar", "success");
    } catch (err) {
      console.error(err);
      showNotice("Gagal memproses gambar", "error");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        });
        setStream(mediaStream);
        setIsCapturing(true);
    } catch (error) {
        console.error("Error accessing camera:", error);
        showNotice("Tidak dapat mengakses kamera. Periksa izin.", "error");
    }
  }, []);
  

  useEffect(() => {
    if (isCapturing && videoRef.current && stream) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch((err) => {
            console.error("Video play failed:", err);
        });
        };
    }
  }, [isCapturing, stream]);

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);


  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const resetImage = () => {
    setImage(null);
    setFile(null);
    setPrediction(null);
    setConfidence(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-screen">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/seta.png" alt="Logo" className="w-12 h-12 object-contain" />
            <h3>SETA</h3>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">Welcome</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Scan your trash, discover the magic! 
          </p>
        </header>

        {/* Main Content */}
        <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-6">
          {/* Preview Area */}
          <div 
            className="w-full aspect-[4/3] rounded-2xl glass overflow-hidden relative animate-scale-in"
            style={{ animationDelay: "0.1s" }}
          >
            {isCapturing ? (
              <>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-4 border-2 border-primary/50 rounded-xl pointer-events-none scan-animation" />
              </>
            ) : image ? (
              <img
                src={image}
                alt="Scanned"
                className="w-full h-full object-contain bg-secondary/30"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Scan className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-sm">No image selected</p>
              </div>
            )}
          </div>

          {/* Hidden elements */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div 
            className="w-full flex flex-col gap-4 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {isCapturing ? (
              <div className="flex gap-4">
                <Button
                  variant="glass"
                  size="xl"
                  onClick={stopCamera}
                  className="flex-1"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </Button>
                <Button
                  variant="scanner"
                  size="xl"
                  onClick={capturePhoto}
                  className="flex-1"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </Button>
              </div>
            ) : image ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button
                    variant="glass"
                    size="xl"
                    onClick={resetImage}
                    className="flex-1"
                    disabled={loading}
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset
                  </Button>
                  <Button
                    variant="scanner"
                    size="xl"
                    onClick={handleProcess}
                    className="flex-1"
                    disabled={loading}
                  >
                    <Scan className="w-5 h-5" />
                    {loading ? "Processing..." : "Process"}
                  </Button>
                </div>

                {prediction && (
                  <div className="w-full glass p-4 rounded-xl text-center">
                    <h3 className="text-lg font-semibold mb-1">Result</h3>
                    <p className="text-xl font-bold text-primary mb-1">{prediction}</p>
                    {confidence !== null && (
                      <p className="text-sm text-muted-foreground">Confidence: {confidence}%</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="scanner"
                  size="xl"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
                <Button
                  variant="glass"
                  size="xl"
                  onClick={startCamera}
                  className="w-full"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </Button>
              </>
            )}
          </div>
          {/* Notice / Toast */}
          {notice && (
            <div className="fixed top-6 right-6 z-50">
              <div
                className={`p-3 rounded-lg shadow-glow border ${
                  notice.type === 'success'
                    ? 'bg-emerald-600 border-emerald-700 text-white'
                    : notice.type === 'error'
                    ? 'bg-red-600 border-red-700 text-white'
                    : 'bg-background text-foreground'
                }`}
              >
                <div className="font-medium">{notice.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer 
          className="mt-auto pt-8 text-center animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-muted-foreground text-sm font-mono">
            Powered by <span className="text-primary">_yoxsz</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Scanner;
