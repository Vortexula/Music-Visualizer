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
let MusicData = null;
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
        MusicData = new Uint8Array(Analyzer.frequencyBinCount)
    }
})

function AnimationTick() {
    VisualizerContext.clearRect(0, 0, MusicVisualizer.width, MusicVisualizer.height)
    requestAnimationFrame(AnimationTick)
    Count++;
    if (Analyzer !== null && VisualizerSelection === "bars") { // Bars Visualizer
        VisualizerContext.fillStyle = Gradient;
        Analyzer.getByteFrequencyData(MusicData)
        let spacing = MusicData.length*Threshold/NumberOfBars
        let BarWidth = MusicVisualizer.width/NumberOfBars
        for (let i = 0; i < NumberOfBars; i++) {
            let SlotIndex = Math.floor(i * spacing) + 1
            let BarY = MusicData[SlotIndex] / 255
            let RealHeight = BarY * MusicVisualizer.height
            let BarHeight = MusicVisualizer.height-RealHeight
            VisualizerContext.fillRect(i*BarWidth, BarHeight, BarWidth-5, RealHeight);
        }
    }
}