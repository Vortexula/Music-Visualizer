import butterchurn from "https://cdn.jsdelivr.net/npm/butterchurn/+esm";

const MusicFile = document.getElementById("audioFile");
const MusicVisualizer = document.getElementById("musicVisualizer");
const VisualizerContainer = document.getElementById("VisualizerContainer")
const ButterchurnCanvas = document.getElementById("butterchurnCanvas")
const VisualizerChoice = document.getElementById("visualizerSelection")
const Controls = document.getElementById("controls");
const VisualizerContext = MusicVisualizer.getContext("2d");

let ButterchurnVisualizer = null

let VisualizerSelection = "bars"

let NumberOfBars = 48;
let Threshold = 0.3;

let isPaused = true;
let _AudioContext = null;
let Analyzer = null;
let Music = null;
let MusicData_Bars = null;
let MusicData_Wave = null;
let Count = 0;

MusicVisualizer.width = MusicVisualizer.clientWidth
MusicVisualizer.height = MusicVisualizer.clientHeight
ButterchurnCanvas.width = ButterchurnCanvas.clientWidth
ButterchurnCanvas.height = ButterchurnCanvas.clientHeight
ButterchurnCanvas.style.visibility = "hidden"
VisualizerContainer.style.aspectRatio = MusicVisualizer.width/MusicVisualizer.height

let Gradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);

Gradient.addColorStop(0, "green")
Gradient.addColorStop(0.5, "yellow")
Gradient.addColorStop(1, "red")

MusicFile.addEventListener("change", function() {
    Music = URL.createObjectURL(MusicFile.files[0]);
    console.log(Music);
    Controls.src = Music
    Controls.play()
})

window.addEventListener("resize", function() {
    MusicVisualizer.width = MusicVisualizer.clientWidth
    MusicVisualizer.height = MusicVisualizer.clientHeight
    ButterchurnCanvas.width = ButterchurnCanvas.clientWidth
    ButterchurnCanvas.height = ButterchurnCanvas.clientHeight
    VisualizerContainer.style.aspectRatio = MusicVisualizer.width/MusicVisualizer.height
    Gradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);
    Gradient.addColorStop(0, "green")
    Gradient.addColorStop(0.5, "yellow")
    Gradient.addColorStop(1, "red") 
    ButterchurnVisualizer.setRendererSize(ButterchurnCanvas.clientWidth, ButterchurnCanvas.clientHeight);
});

VisualizerChoice.addEventListener("change", function() {
    VisualizerSelection = VisualizerChoice.value
    if (VisualizerSelection === "butterchurn") {
        ButterchurnCanvas.style.visibility = "visible"
    } else {
        ButterchurnCanvas.style.visibility = "hidden"
    }
})

Controls.addEventListener("play", function() {
    isPaused = false;
    if (!_AudioContext) {
        _AudioContext = new AudioContext();
        let MediaSource = _AudioContext.createMediaElementSource(Controls);
        Analyzer = _AudioContext.createAnalyser();
        Analyzer.fftSize = 256
        MediaSource.connect(Analyzer)
        Analyzer.connect(_AudioContext.destination)
        MusicData_Bars = new Uint8Array(Analyzer.frequencyBinCount)
        MusicData_Wave = new Uint8Array(Analyzer.fftSize)
        ButterchurnVisualizer = butterchurn.default.createVisualizer(_AudioContext, ButterchurnCanvas, {
            width:"800",
            height:"600"
        });
        ButterchurnVisualizer.connectAudio(MediaSource);
        ButterchurnVisualizer.setRendererSize(ButterchurnCanvas.clientWidth, ButterchurnCanvas.clientHeight);
    }
})

Controls.addEventListener("pause", function() {
    isPaused = true;
})

function BarAnimation() {
    VisualizerContext.fillStyle = Gradient;
    Analyzer.getByteFrequencyData(MusicData_Bars)
    let spacing = MusicData_Bars.length*Threshold/NumberOfBars
    let BarWidth = MusicVisualizer.width/NumberOfBars
    for (let i = 0; i < NumberOfBars; i++) {
        let SlotIndex = Math.floor(i * spacing) + 3
        let BarY = MusicData_Bars[SlotIndex] / 255
        let RealHeight = BarY * MusicVisualizer.height
        let BarHeight = MusicVisualizer.height-RealHeight
        VisualizerContext.fillRect(i*BarWidth, BarHeight, BarWidth-5, RealHeight);
    }
}

function WaveAnimation() {
    Analyzer.getByteTimeDomainData(MusicData_Wave);
    VisualizerContext.beginPath();
    VisualizerContext.lineWidth = 3;
    VisualizerContext.strokeStyle = Gradient;
    for (let i = 0; i < MusicData_Wave.length; i++) {
        let t = i/(MusicData_Wave.length-1)
        let taper = Math.sin(Math.PI*t)
        let Center = MusicVisualizer.height/2
        let Offset = MusicData_Wave[i]-128
        let WaveY = Center+((Offset/128)*taper)*(Center)
        let WaveX = (MusicVisualizer.width/MusicData_Wave.length)*i
        if (i === 0) {
            VisualizerContext.moveTo(WaveX, WaveY);
        } else {
            VisualizerContext.lineTo(WaveX, WaveY);
        }
        }
    VisualizerContext.stroke();
}

function AnimationTick() {
    
    VisualizerContext.clearRect(0, 0, MusicVisualizer.width, MusicVisualizer.height)
    requestAnimationFrame(AnimationTick)
    Count++;

    if (!isPaused && Analyzer) {
        if (VisualizerSelection === "bars") { // Bars Visualizer
           BarAnimation();

        } else if (VisualizerSelection === "wave") { // Wave Visualizer
            WaveAnimation();

        } else if (VisualizerSelection === "butterchurn") { // Butterchurn Visualizer
            ButterchurnVisualizer.render();
        }
    }
}

AnimationTick();