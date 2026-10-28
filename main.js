const MusicFile = document.getElementById("audioFile");
const MusicVisualizer = document.getElementById("musicVisualizer");
const VisualizerChoice = document.getElementById("visualizerSelection")
const Controls = document.getElementById("controls");
const VisualizerContext = MusicVisualizer.getContext("2d");

let VisualizerSelection = "bars"

let NumberOfBars = 48;
let Threshold = 0.3;

let _AudioContext = null;
let Analyzer = null;
let Music = null;
let MusicData_Bars = null;
let MusicData_Wave = null;
let Count = 0;

MusicVisualizer.width = MusicVisualizer.clientWidth
MusicVisualizer.height = MusicVisualizer.clientHeight

const Gradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);

Gradient.addColorStop(0, "green")
Gradient.addColorStop(0.5, "yellow")
Gradient.addColorStop(1, "red")

MusicFile.addEventListener("change", function() {
    Music = URL.createObjectURL(MusicFile.files[0]);
    console.log(Music);
    Controls.src = Music
    CanVisualize = true;
    Controls.play();
    AnimationTick();
});

MusicVisualizer.addEventListener("resize", function() {
    MusicVisualizer.width = MusicVisualizer.clientWidth
    MusicVisualizer.height = MusicVisualizer.clientHeight
});

VisualizerChoice.addEventListener("change", function() {
    VisualizerSelection = VisualizerChoice.value
})

Controls.addEventListener("play", function() {
    if (_AudioContext === null) {
        _AudioContext = new AudioContext();
        let MediaSource = _AudioContext.createMediaElementSource(Controls);
        Analyzer = _AudioContext.createAnalyser();
        Analyzer.fftSize = 256
        MediaSource.connect(Analyzer)
        Analyzer.connect(_AudioContext.destination)
        MusicData_Bars = new Uint8Array(Analyzer.frequencyBinCount)
        MusicData_Wave = new Uint8Array(Analyzer.fftSize)
    }
})

function AnimationTick() {
    VisualizerContext.clearRect(0, 0, MusicVisualizer.width, MusicVisualizer.height)
    requestAnimationFrame(AnimationTick)
    Count++;
    if (Analyzer !== null && VisualizerSelection === "bars") { // Bars Visualizer
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
    } else if (Analyzer !== null && VisualizerSelection === "wave") {
        Analyzer.getByteTimeDomainData(MusicData_Wave);
        VisualizerContext.beginPath();
        VisualizerContext.lineWidth = 3;
        VisualizerContext.strokeStyle = Gradient;
        for (let i = 0; i < MusicData_Wave.length; i++) {
            let t = i/(MusicData_Wave.length-1)
            let taper = Math.sin(Math.PI * t)
            let Center = MusicVisualizer.height/2
            let Offset = MusicData_Wave[i] - 128
            let NewY = Center + ((Offset/128)*taper) * (Center)
            let WaveX = (MusicVisualizer.width/MusicData_Wave.length)*i
            if (i === 0) {
                VisualizerContext.moveTo(WaveX, NewY);
            } else {
                VisualizerContext.lineTo(WaveX, NewY);
            }
        }
        VisualizerContext.stroke();
    }
}