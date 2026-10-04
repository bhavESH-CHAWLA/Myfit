import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Pause, Play, Square } from "lucide-react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import "./MyFitPages.css";

const wasmPath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const poseModelPath = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const connections = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 29], [29, 31], [28, 30], [30, 32],
];

function angleAtJoint(first, joint, third) {
  const firstAngle = Math.atan2(first.y - joint.y, first.x - joint.x);
  const thirdAngle = Math.atan2(third.y - joint.y, third.x - joint.x);
  const radians = Math.abs(firstAngle - thirdAngle);
  return Math.round(Math.min(radians, Math.PI * 2 - radians) * (180 / Math.PI));
}

function Session() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const frameRef = useRef(null);
  const activeRef = useRef(false);
  const phaseRef = useRef("standing");
  const repetitionsRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("Camera is off");
  const [feedback, setFeedback] = useState("Start the camera to detect your movement.");
  const [kneeAngle, setKneeAngle] = useState(null);
  const [repetitions, setRepetitions] = useState(0);
  const [error, setError] = useState("");

  const drawPose = (landmarks) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#f0b44c";
    context.fillStyle = "#f0b44c";
    context.lineWidth = Math.max(3, canvas.width / 240);

    connections.forEach(([start, end]) => {
      const first = landmarks[start];
      const second = landmarks[end];
      if (!first || !second || first.visibility < 0.35 || second.visibility < 0.35) return;
      context.beginPath();
      context.moveTo(first.x * canvas.width, first.y * canvas.height);
      context.lineTo(second.x * canvas.width, second.y * canvas.height);
      context.stroke();
    });

    landmarks.forEach((landmark) => {
      if (landmark.visibility < 0.35) return;
      context.beginPath();
      context.arc(landmark.x * canvas.width, landmark.y * canvas.height, context.lineWidth * 1.15, 0, Math.PI * 2);
      context.fill();
    });
  };

  const startAnalysis = () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    activeRef.current = true;
    setAnalyzing(true);
    setStatus("Looking for body landmarks");

    const analyzeFrame = () => {
      if (!activeRef.current) return;

      const video = videoRef.current;
      if (video?.readyState >= 2) {
        const result = landmarkerRef.current.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];

        if (landmarks) {
          drawPose(landmarks);
          const left = [landmarks[23], landmarks[25], landmarks[27]];
          const right = [landmarks[24], landmarks[26], landmarks[28]];
          const visibleSide = [left, right].find((side) => side.every((point) => point && point.visibility > 0.5));

          if (visibleSide) {
            const angle = angleAtJoint(...visibleSide);
            if (angle < 135 && phaseRef.current === "standing") phaseRef.current = "bent";
            if (angle > 160 && phaseRef.current === "bent") {
              phaseRef.current = "standing";
              repetitionsRef.current += 1;
              setRepetitions(repetitionsRef.current);
            }

            if (performance.now() - lastUpdateRef.current > 250) {
              setKneeAngle(angle);
              setStatus("Pose detected");
              setFeedback(
                angle < 135
                  ? "Knee bend detected. Move only within a comfortable range."
                  : phaseRef.current === "bent"
                    ? "Return toward standing when comfortable."
                    : "Standing position detected. Begin a controlled bend when ready."
              );
              lastUpdateRef.current = performance.now();
            }
          } else if (performance.now() - lastUpdateRef.current > 700) {
            setStatus("Move into full view");
            setFeedback("Step back until your hip, knee, and ankle are visible.");
            lastUpdateRef.current = performance.now();
          }
        } else if (performance.now() - lastUpdateRef.current > 700) {
          const context = canvasRef.current?.getContext("2d");
          context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setStatus("No pose detected");
          setFeedback("Stand where your full body is visible to the camera.");
          setKneeAngle(null);
          lastUpdateRef.current = performance.now();
        }
      }

      frameRef.current = requestAnimationFrame(analyzeFrame);
    };

    frameRef.current = requestAnimationFrame(analyzeFrame);
  };

  const startCamera = async () => {
    setError("");
    setStatus("Requesting camera access");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access requires a secure browser connection.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("Loading pose model");

      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: poseModelPath },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      setCameraReady(true);
      startAnalysis();
    } catch (caughtError) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setStatus("Camera unavailable");
      setError(caughtError.message || "Unable to start camera-based pose detection.");
    }
  };

  const stopCamera = () => {
    activeRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const context = canvasRef.current?.getContext("2d");
    if (context && canvasRef.current) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCameraReady(false);
    setAnalyzing(false);
    setKneeAngle(null);
    setRepetitions(0);
    repetitionsRef.current = 0;
    phaseRef.current = "standing";
    setStatus("Camera is off");
    setFeedback("Start the camera to detect your movement.");
  };

  useEffect(() => () => {
    activeRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close();
  }, []);

  return (
    <div className="session-shell">
      <header className="session-topbar">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="session-title">
          <span className="eyebrow">MOVEMENT CHECK</span>
          <h1>Knee bend</h1>
        </div>
        <button
          className="secondary-btn compact-btn"
          onClick={() => {
            stopCamera();
            navigate("/dashboard");
          }}
        >
          End session
        </button>
      </header>

      <main className="session-layout">
        <section className="session-video card">
          <div className="video-header">
            <div>
              <strong>{status}</strong>
              <span>Your video is processed in this browser.</span>
            </div>
            <div className={analyzing ? "live-pill" : "camera-pill"}>{analyzing ? "Analyzing" : "Camera off"}</div>
          </div>

          <div className="pose-stage camera-stage">
            <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="pose-canvas" aria-hidden="true" />
            {!cameraReady && (
              <div className="camera-placeholder">
                <Camera size={34} />
                <span>Camera preview appears here</span>
              </div>
            )}
            <div className="score-overlay">
              <span>Estimated knee angle</span>
              <strong>{kneeAngle === null ? "--" : `${kneeAngle}°`}</strong>
            </div>
          </div>

          {error && <p className="camera-error" role="alert">{error}</p>}

          <div className="video-actions">
            {!cameraReady ? (
              <button className="primary-btn session-btn" onClick={startCamera}>
                <Camera size={16} />
                Start camera
              </button>
            ) : (
              <button
                className="primary-btn session-btn"
                onClick={analyzing ? () => {
                  activeRef.current = false;
                  if (frameRef.current) cancelAnimationFrame(frameRef.current);
                  setAnalyzing(false);
                  setStatus("Analysis paused");
                } : startAnalysis}
              >
                {analyzing ? <Pause size={16} /> : <Play size={16} />}
                {analyzing ? "Pause analysis" : "Resume analysis"}
              </button>
            )}
            {cameraReady && (
              <button className="secondary-btn session-btn-alt" onClick={stopCamera}>
                <Square size={15} />
                Stop camera
              </button>
            )}
          </div>
        </section>

        <aside className="session-side">
          <div className="card metric-panel movement-panel">
            <div className="panel-header">
              <h3>Movement readout</h3>
            </div>
            <div className="movement-stats">
              <div>
                <span>Estimated knee angle</span>
                <strong>{kneeAngle === null ? "--" : `${kneeAngle}°`}</strong>
              </div>
              <div>
                <span>Bend and return cycles</span>
                <strong>{repetitions}</strong>
              </div>
            </div>
            <p className="movement-feedback" aria-live="polite">{feedback}</p>
          </div>
          <p className="session-disclaimer">
            Pose estimates are experimental movement feedback, not a diagnosis or a substitute for advice from your clinician.
          </p>
        </aside>
      </main>
    </div>
  );
}

export default Session;