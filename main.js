import butterchurn from "https://cdn.jsdelivr.net/npm/butterchurn/+esm";

const MusicFile = document.getElementById("audioFile");
const SyncButton = document.getElementById("SyncButton")
const MusicVisualizer = document.getElementById("musicVisualizer");
const VisualizerContainer = document.getElementById("VisualizerContainer");
const ButterchurnCanvas = document.getElementById("butterchurnCanvas");
const ParticleCanvas = document.getElementById("ParticleCanvas");
const VisualizerChoice = document.getElementById("visualizerSelection");
const BarCountChoice = document.getElementById("BarCount");
const AnalyzerChoice = document.getElementById("AnalyzerLimit");
const Controls = document.getElementById("controls");
const VisualizerContext = MusicVisualizer.getContext("2d");
const ParticleContext = ParticleCanvas.getContext("2d");

let ButterchurnVisualizer = null;

let VisualizerSelection = "bars";

let NumberOfBars = 48;
let Threshold = 0.3;
let StartRadius = 100;
let AnalyzerRange = 256;

let ParticleColumns = 120; // 120 Wave, 60 Drop
let ParticleRows = 100; // 100 Wave, 40 Drop
let ParticlePreset = "Wave"; // Drop, Wave
let ParticleWaveDefaultSize = 0.2;
let ParticleBassStrength = 10;
let NumberOfDots = (ParticleColumns*ParticleRows);

let AudioMode = "UserOutput"; // File - UserOutput
let AudioStream = null;
let MediaSource = null;
let isPaused = true;
let _AudioContext = null;
let Analyzer = null;
let Music = null;
let MusicData_Bars = null;
let MusicData_Wave = null;
let MusicData_Particle = null;
let UsualBass = 0;
let Count = 0;

if (ParticlePreset === "Wave") {
    ParticleColumns = 120
    ParticleRows = 100
} else if (ParticlePreset === "Drop") {
    ParticleColumns = 60
    ParticleRows = 40
}

MusicVisualizer.width = MusicVisualizer.clientWidth
MusicVisualizer.height = MusicVisualizer.clientHeight
ButterchurnCanvas.width = ButterchurnCanvas.clientWidth
ButterchurnCanvas.height = ButterchurnCanvas.clientHeight
ParticleCanvas.width = ParticleCanvas.clientWidth
ParticleCanvas.height = ParticleCanvas.clientHeight
ButterchurnCanvas.style.visibility = "hidden"
VisualizerContainer.style.aspectRatio = MusicVisualizer.width/MusicVisualizer.height

let CenterX = MusicVisualizer.width/2;
let CenterY = MusicVisualizer.height/2;

let Gradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);
let RadialGradient = VisualizerContext.createRadialGradient(CenterX, CenterY, StartRadius, CenterX, CenterY, StartRadius*2);
let CenterGradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);

MusicFile.addEventListener("change", function() {
    Music = URL.createObjectURL(MusicFile.files[0]);
    AudioMode = "File";
    Controls.src = Music
    Controls.play();
})

SyncButton.addEventListener("click", async function() {
    isPaused = false;
    Controls.src = null;
    if (!_AudioContext) {
        _AudioContext = new AudioContext();
    }
    try {
    AudioStream = await navigator.mediaDevices.getDisplayMedia({audio: true})
    } catch (error) {
        console.log("User denied.")
        return
    }
    AudioMode = "Sync";
    MediaSource = _AudioContext.createMediaStreamSource(AudioStream);
    Analyzer = _AudioContext.createAnalyser();
    Analyzer.fftSize = AnalyzerRange;
    MediaSource.connect(Analyzer)
    MusicData_Bars = new Uint8Array(Analyzer.frequencyBinCount)
    MusicData_Particle = new Uint8Array(Analyzer.frequencyBinCount)
    MusicData_Wave = new Uint8Array(Analyzer.fftSize)
    ButterchurnVisualizer = butterchurn.default.createVisualizer(_AudioContext, ButterchurnCanvas, {
        width:"800",
        height:"600"
    });
    ButterchurnVisualizer.connectAudio(MediaSource);
    ButterchurnVisualizer.setRendererSize(ButterchurnCanvas.clientWidth, ButterchurnCanvas.clientHeight);

})

window.addEventListener("resize", function() {
    MusicVisualizer.width = MusicVisualizer.clientWidth
    MusicVisualizer.height = MusicVisualizer.clientHeight
    CenterY = MusicVisualizer.height/2
    CenterX = MusicVisualizer.width/2
    ButterchurnCanvas.width = ButterchurnCanvas.clientWidth
    ButterchurnCanvas.height = ButterchurnCanvas.clientHeight
    ParticleCanvas.width = ParticleCanvas.clientWidth
    ParticleCanvas.height = ParticleCanvas.clientHeight
    VisualizerContainer.style.aspectRatio = MusicVisualizer.width/MusicVisualizer.height
    UpdateGradients();
    if (ButterchurnVisualizer) {
        ButterchurnVisualizer.setRendererSize(ButterchurnCanvas.clientWidth, ButterchurnCanvas.clientHeight);
    }
});

VisualizerChoice.addEventListener("change", function() {
    VisualizerSelection = VisualizerChoice.value
    if (VisualizerSelection === "butterchurn") {
        ButterchurnCanvas.style.visibility = "visible"
    } else {
        ButterchurnCanvas.style.visibility = "hidden"
    }
})

BarCountChoice.addEventListener("change", function() {
    if (!isNaN(BarCountChoice.value) && BarCountChoice.value > 1 && BarCountChoice.value <= AnalyzerRange) {
        NumberOfBars = BarCountChoice.value;
    }
})

AnalyzerChoice.addEventListener("change", function() {
    AnalyzerRange = AnalyzerChoice.value;
    Analyzer.fftSize = AnalyzerRange;
    MusicData_Bars = new Uint8Array(Analyzer.frequencyBinCount)
    MusicData_Wave = new Uint8Array(Analyzer.fftSize)
})

Controls.addEventListener("play", function() {
    isPaused = false;
    if (!_AudioContext && AudioMode === "File") {
        _AudioContext = new AudioContext();
        MediaSource = _AudioContext.createMediaElementSource(Controls);
        Analyzer = _AudioContext.createAnalyser();
        Analyzer.fftSize = AnalyzerRange;
        MediaSource.connect(Analyzer)
        Analyzer.connect(_AudioContext.destination)
        MusicData_Bars = new Uint8Array(Analyzer.frequencyBinCount)
        MusicData_Particle = new Uint8Array(Analyzer.frequencyBinCount)
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
    if (AudioMode === "File") {
        isPaused = true;
    }
})

function BarAnimation() {
    VisualizerContext.fillStyle = Gradient;
    Analyzer.getByteFrequencyData(MusicData_Bars)
    let spacing = MusicData_Bars.length*Threshold/NumberOfBars
    let BarWidth = MusicVisualizer.width/NumberOfBars
    for (let i = 0; i < NumberOfBars; i++) {
        let SlotIndex = Math.floor(i * spacing) + 3
        let BarY = MusicData_Bars[SlotIndex] / 256
        let RealHeight = BarY * MusicVisualizer.height
        let BarHeight = MusicVisualizer.height-RealHeight
        VisualizerContext.fillRect(i*BarWidth, BarHeight, BarWidth-5, RealHeight);
    }
}

function CenterBarAnimation() {
    VisualizerContext.fillStyle = CenterGradient;
    Analyzer.getByteFrequencyData(MusicData_Bars)
    let spacing = MusicData_Bars.length*Threshold/NumberOfBars
    let BarWidth = MusicVisualizer.width/NumberOfBars
    for (let i = 0; i < NumberOfBars; i++) {
        let SlotIndex = Math.floor(i * spacing) + 3
        let BarY = MusicData_Bars[SlotIndex] / 256
        let RealHeight = BarY * CenterY
        let BarHeight = CenterY-RealHeight
        VisualizerContext.fillRect(i*BarWidth, CenterY, BarWidth-5, RealHeight);
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
        let WaveY = Center+((Offset/128)*taper)*(Center)
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
        let Offset = MusicData_Wave[i]
        let WaveY = CenterY+Math.sin(Angle)*Offset
        let WaveX = CenterX+Math.cos(Angle)*Offset
        
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
        let Offset = MusicData_Wave[i]-128
        let WaveY =  CenterY+((Offset/128)*taper)*(CenterY)*1.2
        let WaveX = MusicVisualizer.width/2+Offset*2
        VisualizerContext.strokeStyle = RadialGradient;
        if (i === 0) {
            VisualizerContext.moveTo(WaveX, WaveY);
        } else {
            VisualizerContext.lineTo(WaveX, WaveY);
        }
        }
    VisualizerContext.stroke();
}

function ParticleAnimation() {
    //if (Analyzer) {
        let CenterX = ParticleCanvas.width/2;
        let Horizon = ParticleCanvas.height*0.3;
        let FloorHeight = 2;
        let Scale = (ParticleCanvas.height - Horizon)/FloorHeight;
        let Radius = 6;
        let Gap = 0.1;
        let CenterZ = 1+(ParticleRows/2)*Gap
        let WaveTightness = 5;
        let WaveSize = 0.2;
        let Punch
        let AvgBass
        let Ratio

        if (MusicData_Particle) { // Wave Size Additive
            Analyzer.getByteFrequencyData(MusicData_Particle);
            AvgBass = WaveSize*((MusicData_Particle[1]+MusicData_Particle[2]+MusicData_Particle[3])/3)
            UsualBass = UsualBass+(AvgBass-UsualBass)*0.02
            Ratio = AvgBass/UsualBass
            Punch = Math.max(0, Ratio-1)
            WaveSize = ParticleWaveDefaultSize+Punch*ParticleBassStrength;
            // Additive based on average of first 3 values in analyzer.
            // Multiplied by itself subtracting the usual bass times a very low number to get the difference.
            // The punch is the max value between 0 and the avgbass divided by the usualbass.
            // WaveSize is base WaveSize+Punch*Multiplier
        }
        for (let y=0; y < ParticleRows; y++) { // For Each Row
            let Z = 1+y*Gap
            ParticleContext.beginPath();
            let Opacity = y/(ParticleRows-1)
            ParticleContext.fillStyle = `rgba(100,100,100, ${(1-Opacity)*0.9}1)`; // Reduces opacity from current row in total rows.
            for (let x=0; x < ParticleColumns; x++) { // For Each Column
                let WorldX = (x-(ParticleColumns/2))*Gap
                if (ParticlePreset === "Drop") {
                    CenterZ = 1+(ParticleRows/2)*Gap
                    WorldX = (x-(ParticleColumns/2))*Gap
                    CenterX = ParticleCanvas.width/2
                    ParticleColumns = 60
                    ParticleRows = 40
                } else if (ParticlePreset === "Wave") {
                    CenterZ = 1+(ParticleRows)*Gap
                    WorldX = (x-(ParticleColumns-0.5))*Gap
                    CenterX = ParticleCanvas.width
                    ParticleColumns = 240
                    ParticleRows = 100
                }
                let ScreenX = CenterX+WorldX*Scale/Z
                let Distance = Math.sqrt(WorldX**2+(Z-CenterZ)**2) // Determines distance of particle based on row and column.
                let Height = Math.sin(Distance*WaveTightness - Count*0.05) * WaveSize; // Determines Particle Height in wave.
                let ScreenY = Horizon+(FloorHeight-Height)*Scale/Z
                let Size = Radius/Z
                ParticleContext.moveTo(ScreenX+Size, ScreenY);
                ParticleContext.arc(ScreenX, ScreenY, Size, 0, (2*Math.PI)); // Draw particle at screen space position.
            }
            ParticleContext.fill();
        }
    //}
}

function UpdateGradients() {
    Gradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);
    RadialGradient = VisualizerContext.createRadialGradient(CenterX, CenterY, StartRadius, CenterX, CenterY, StartRadius*2);
    CenterGradient = VisualizerContext.createLinearGradient(0, MusicVisualizer.height, 0, 0);

    Gradient.addColorStop(0, "green")
    Gradient.addColorStop(0.5, "yellow")
    Gradient.addColorStop(1, "red")

    RadialGradient.addColorStop(0, "green")
    RadialGradient.addColorStop(0.5, "yellow")
    RadialGradient.addColorStop(1, "red")

    CenterGradient.addColorStop(0, "purple")
    CenterGradient.addColorStop(0.25, "blue")
    CenterGradient.addColorStop(0.5, "cyan")
    CenterGradient.addColorStop(0.75, "blue")
    CenterGradient.addColorStop(1, "purple")
}

function AnimationTick() {
    
    VisualizerContext.clearRect(0, 0, MusicVisualizer.width, MusicVisualizer.height)
    ParticleContext.clearRect(0, 0, ParticleCanvas.width, ParticleCanvas.height)
    requestAnimationFrame(AnimationTick)
    Count++;

    ParticleAnimation();

    if (!isPaused && Analyzer) {
        if (VisualizerSelection === "bars") { // Bars Visualizer
           BarAnimation();

        } else if (VisualizerSelection === "centerbars") { // Center Bars Visualizer
            CenterBarAnimation();

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

UpdateGradients();
AnimationTick();