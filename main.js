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
let StartRadius = 100;

let RadialGradient = null;
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
        let t = i/(MusicData_Wave.length-1) // t is how far along the wave this point is. (0-1)
        let taper = Math.sin(Math.PI*t) // Multiplying t by PI in a sine makes it go from 0-1-0 (like a hill).
        let Center = MusicVisualizer.height/2 // Half the height of canvas.
        let Offset = MusicData_Wave[i]-128 // Offset converts analyzers unsigned 8-bit integer to a 8-bit signed integer. (-128>+127)
        let WaveY =  Center+((Offset/128)*taper)*(Center) 
        // WaveY is defined as center + (offset / 128, which is a range between -1, 1, 0 being center of the canvas)
        // Then the offset/128 is multiplied by taper which is a range between 0, 1, 0, depending on index.
        // That is multiplied by half the canvas height to allow it to move up and down. (-Center to +Center)
        // Example: 250+((110/128)*Math.sin(Math.PI*(238/255)))*250 = ~295
        let WaveX = (MusicVisualizer.width/MusicData_Wave.length)*i
        if (i === 0) {
            VisualizerContext.moveTo(WaveX, WaveY);
        } else {
            VisualizerContext.lineTo(WaveX, WaveY);
        }
        }
    VisualizerContext.stroke();
}

function CircularAnimation() {
    Analyzer.getByteTimeDomainData(MusicData_Wave);
    VisualizerContext.beginPath();
    VisualizerContext.lineWidth = 3;
    let i0x,i0y = null;
    for (let i = 0; i < MusicData_Wave.length; i++) {
        let Angle = i/(MusicData_Wave.length)*(2*Math.PI)
        let CenterY = MusicVisualizer.height/2
        let CenterX = MusicVisualizer.width/2
        let Offset = MusicData_Wave[i]
        let WaveY = CenterY+Math.sin(Angle)*Offset
        let WaveX = CenterX+Math.cos(Angle)*Offset
        RadialGradient = VisualizerContext.createRadialGradient(CenterX, CenterY, StartRadius, CenterX, CenterY, StartRadius*2);
        RadialGradient.addColorStop(0, "green")
        RadialGradient.addColorStop(0.5, "yellow")
        RadialGradient.addColorStop(1, "red")
        VisualizerContext.strokeStyle = RadialGradient;
        if (i === 0) {
            VisualizerContext.moveTo(WaveX, WaveY);
            i0x = WaveX
            i0y = WaveY
        } else if (i === MusicData_Wave.length-1) {
            VisualizerContext.quadraticCurveTo(WaveX, WaveY, i0x, i0y);
        } else {
            VisualizerContext.lineTo(WaveX, WaveY);
        }
        }
    VisualizerContext.stroke();
}

function ButterflyAnimation() {
    Analyzer.getByteTimeDomainData(MusicData_Wave);
    VisualizerContext.beginPath();
    VisualizerContext.lineWidth = 3;
    for (let i = 0; i < MusicData_Wave.length; i++) {
        let t = i/(MusicData_Wave.length-1)
        let taper = Math.cos(Math.PI*t)
        let CenterY = MusicVisualizer.height/2
        let CenterX = MusicVisualizer.width/2
        let Offset = MusicData_Wave[i]-128
        let WaveY =  CenterY+((Offset/128)*taper)*(CenterY)*1.2
        let WaveX = MusicVisualizer.width/2+Offset*2
        RadialGradient = VisualizerContext.createRadialGradient(CenterX, CenterY, StartRadius, CenterX, CenterY, StartRadius*2);
        RadialGradient.addColorStop(0, "green")
        RadialGradient.addColorStop(0.1, "yellow")
        RadialGradient.addColorStop(0.5, "red")
        VisualizerContext.strokeStyle = RadialGradient;
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

        } else if (VisualizerSelection === "circular") { // Circular Visualizer
            CircularAnimation();

        } else if (VisualizerSelection === "butterfly") { // Butterfly Visualizer
            ButterflyAnimation();
        }
    }
}

AnimationTick();