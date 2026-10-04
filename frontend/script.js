
// ============================================================
// NEUROHOME FRONTEND
// EEG upload + prediction + confidence + waveform
// Smart-home command layer
// ============================================================

const API_URL = "https://neurodomain-backend.onrender.com";


// ============================================================
// ELEMENTS
// ============================================================

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");

const predictionText =
    document.getElementById("predictionText");

const predictionDescription =
    document.getElementById("predictionDescription");

const confidenceValue =
    document.getElementById("confidenceValue");

const confidenceBar =
    document.getElementById("confidenceBar");

const predictionIcon =
    document.getElementById("predictionIcon");


// ============================================================
// SMART HOME ELEMENTS
// ============================================================

const lightBulb =
    document.getElementById("lightBulb");

const lightStatus =
    document.getElementById("lightStatus");

const lightStatusText =
    document.getElementById("lightStatusText");


const fanVisual =
    document.getElementById("fanVisual");

const fanStatus =
    document.getElementById("fanStatus");

const fanStatusText =
    document.getElementById("fanStatusText");


const tvVisual =
    document.getElementById("tvVisual");

const tvStatus =
    document.getElementById("tvStatus");

const tvStatusText =
    document.getElementById("tvStatusText");


// ============================================================
// BCI COMMAND ELEMENTS
// ============================================================

const bciCommand =
    document.getElementById("bciCommand");

const bciCommandDescription =
    document.getElementById("bciCommandDescription");

const commandIndicator =
    document.getElementById("commandIndicator");

const commandButtons =
    document.querySelectorAll(".command-button");


// ============================================================
// APPLIANCE CONTROL
// ============================================================

function updateLight(isOn) {

    if (isOn) {

        lightBulb.classList.remove("off");
        lightBulb.classList.add("on");

        lightStatus.classList.remove("off");
        lightStatus.classList.add("on");

        lightStatus.textContent = "ON";

        lightStatusText.textContent =
            "Light activated by BCI command.";

    } else {

        lightBulb.classList.remove("on");
        lightBulb.classList.add("off");

        lightStatus.classList.remove("on");
        lightStatus.classList.add("off");

        lightStatus.textContent = "OFF";

        lightStatusText.textContent =
            "Waiting for BCI command.";

    }

}


function updateFan(isOn) {

    if (isOn) {

        fanVisual.classList.remove("off");
        fanVisual.classList.add("on");

        fanStatus.classList.remove("off");
        fanStatus.classList.add("on");

        fanStatus.textContent = "ON";

        fanStatusText.textContent =
            "Fan activated by BCI command.";

    } else {

        fanVisual.classList.remove("on");
        fanVisual.classList.add("off");

        fanStatus.classList.remove("on");
        fanStatus.classList.add("off");

        fanStatus.textContent = "OFF";

        fanStatusText.textContent =
            "Waiting for BCI command.";

    }

}


function updateTV(isOn) {

    if (isOn) {

        tvVisual.classList.remove("off");
        tvVisual.classList.add("on");

        tvStatus.classList.remove("off");
        tvStatus.classList.add("on");

        tvStatus.textContent = "ON";

        tvStatusText.textContent =
            "TV activated by BCI command.";

    } else {

        tvVisual.classList.remove("on");
        tvVisual.classList.add("off");

        tvStatus.classList.remove("on");
        tvStatus.classList.add("off");

        tvStatus.textContent = "OFF";

        tvStatusText.textContent =
            "Waiting for BCI command.";

    }

}


// ============================================================
// TURN EVERYTHING OFF
// ============================================================

function turnAllAppliancesOff() {

    updateLight(false);
    updateFan(false);
    updateTV(false);

}


// ============================================================
// UPDATE BCI COMMAND DISPLAY
// ============================================================

function updateBCICommand(command) {

    bciCommand.textContent = command;

    if (command === "NONE") {

        bciCommandDescription.textContent =
            "No appliance command detected.";

        commandIndicator.classList.remove("active");

    } else {

        bciCommandDescription.textContent =
            `${command} command selected for prototype testing.`;

        commandIndicator.classList.add("active");

    }

}


// ============================================================
// EXECUTE COMMAND
// ============================================================

function executeCommand(command) {

    // Turn everything off first

    turnAllAppliancesOff();


    // Update command display

    updateBCICommand(command);


    // Activate requested appliance

    if (command === "LIGHT") {

        updateLight(true);

    }

    else if (command === "FAN") {

        updateFan(true);

    }

    else if (command === "TV") {

        updateTV(true);

    }

}


// ============================================================
// DEMO COMMAND BUTTONS
// ============================================================

commandButtons.forEach(button => {

    button.addEventListener("click", () => {

        const command =
            button.dataset.command;


        // Remove active state

        commandButtons.forEach(item => {

            item.classList.remove("active");

        });


        // Activate clicked button

        button.classList.add("active");


        // Execute command

        executeCommand(command);

    });

});


// ============================================================
// EEG INTERACTIVE CHART
// ============================================================

const chartCanvas =
    document.getElementById("eegChart");

const chartContext =
    chartCanvas.getContext("2d");


// ============================================================
// EEG CHART
// ============================================================

const eegChart = new Chart(
    chartContext,
    {
        type: "line",

        data: {

            labels: [],

            datasets: [
                {
                    label: "EEG Signal",

                    data: [],

                    borderWidth: 1.5,

                    pointRadius: 0,

                    pointHoverRadius: 5,

                    pointHoverBorderWidth: 2,

                    tension: 0.15,

                    fill: false
                }
            ]
        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: false,


            interaction: {

                mode: "index",

                intersect: false

            },


            plugins: {

                legend: {
                    display: false
                },


                tooltip: {

                    enabled: true,

                    displayColors: false,

                    backgroundColor:
                        "rgba(4, 12, 22, 0.95)",

                    borderColor:
                        "rgba(66, 217, 255, 0.35)",

                    borderWidth: 1,

                    titleColor:
                        "#76e7ff",

                    bodyColor:
                        "#edf8ff",

                    padding: 10,

                    callbacks: {

                        title: function(context) {

                            const sample =
                                context[0].dataIndex;

                            const time =
                                sample / 256;

                            return `Time: ${time.toFixed(3)} s`;

                        },


                        label: function(context) {

                            return `Amplitude: ${Number(
                                context.raw
                            ).toFixed(6)}`;

                        }

                    }

                }

            },


            scales: {

                x: {

                    title: {

                        display: true,

                        text: "Time (seconds)"

                    },

                    ticks: {

                        maxTicksLimit: 10

                    },

                    grid: {

                        color:
                            "rgba(255,255,255,0.05)"

                    }

                },


                y: {

                    title: {

                        display: true,

                        text: "EEG Amplitude"

                    },

                    grid: {

                        color:
                            "rgba(255,255,255,0.05)"

                    }

                }

            }

        }

    }
);


// ============================================================
// UPDATE EEG WAVEFORM
// ============================================================

function updateEEGChart(waveform) {

    if (
        !waveform ||
        waveform.length === 0
    ) {

        console.warn(
            "No EEG waveform received."
        );

        return;

    }


    // Sampling frequency

    const samplingRate = 256;


    // Create time labels

    const labels =
        waveform.map(
            (_, index) =>
                index / samplingRate
        );


    // Update chart

    eegChart.data.labels =
        labels;

    eegChart.data.datasets[0].data =
        waveform;
 
    sampleCount.textContent =
    waveform.length;    

    // Redraw

    eegChart.update();


    console.log(
        "Interactive EEG waveform displayed:",
        waveform.length,
        "samples"
    );

}

// ============================================================
// EEG CURSOR READOUT
// ============================================================

const cursorTime =
    document.getElementById("cursorTime");

const cursorAmplitude =
    document.getElementById("cursorAmplitude");

const sampleCount =
    document.getElementById("sampleCount");


chartCanvas.addEventListener(
    "mousemove",
    function(event) {

        if (
            !eegChart.data.datasets[0].data.length
        ) {
            return;
        }


        const points =
            eegChart.getElementsAtEventForMode(
                event,
                "index",
                {
                    intersect: false
                },
                false
            );


        if (!points.length) {
            return;
        }


        const index =
            points[0].index;

        const value =
            eegChart.data.datasets[0].data[index];

        const time =
            index / 256;


        cursorTime.textContent =
            `${time.toFixed(3)} s`;

        cursorAmplitude.textContent =
            Number(value).toFixed(6);

    }
);

// ============================================================
// FILE SELECTION
// ============================================================

fileInput.addEventListener(
    "change",
    async function () {

        const file =
            fileInput.files[0];


        if (!file) {
            return;
        }


        // ====================================================
        // FILE NAME
        // ====================================================

        fileName.textContent =
            file.name;


        // ====================================================
        // PROCESSING STATE
        // ====================================================

        predictionText.textContent =
            "Analyzing EEG...";

        predictionDescription.textContent =
            "NeuroHome is preprocessing the EEG recording and running the CNN.";

        confidenceValue.textContent =
            "--%";

        confidenceBar.style.width =
            "0%";

        predictionIcon.textContent =
            "🧠";


        // Turn appliances off during processing

        turnAllAppliancesOff();

        updateBCICommand("NONE");


        // ====================================================
        // PREPARE FILE
        // ====================================================

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        try {

            // =================================================
            // SEND EEG TO FASTAPI
            // =================================================

            const response =
                await fetch(
                    `${API_URL}/process-edf`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            // =================================================
            // CHECK RESPONSE
            // =================================================

            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }


            // =================================================
            // READ JSON
            // =================================================

            const result =
                await response.json();


            console.log(
                "NeuroHome result:",
                result
            );


            // =================================================
            // BACKEND ERROR
            // =================================================

            if (result.error) {

                throw new Error(
                    result.error
                );

            }


            // =================================================
            // DISPLAY WAVEFORM
            // =================================================

            updateEEGChart(
                result.waveform
            );


            // =================================================
            // GET PREDICTION
            // =================================================

            const label =
                result.label;

            const confidence =
                result.confidence * 100;


            // =================================================
            // UPDATE PREDICTION CARD
            // =================================================

            predictionText.textContent =
                label;

            confidenceValue.textContent =
                `${confidence.toFixed(2)}%`;

            confidenceBar.style.width =
                `${confidence}%`;


            // =================================================
            // TARGET
            // =================================================

            if (label === "Target") {

                predictionDescription.textContent =
                    "Target brain response detected. Intentional BCI response identified.";

                predictionIcon.textContent =
                    "⚡";

            }


            // =================================================
            // NON-TARGET
            // =================================================

            else {

                predictionDescription.textContent =
                    "Non-target brain response detected. No BCI command triggered.";

                predictionIcon.textContent =
                    "🧠";

                executeCommand("NONE");

            }

        }


        // ====================================================
        // ERROR HANDLING
        // ====================================================

        catch (error) {

            console.error(
                "NeuroHome error:",
                error
            );


            predictionText.textContent =
                "Analysis Failed";

            predictionDescription.textContent =
                error.message;

            confidenceValue.textContent =
                "--%";

            confidenceBar.style.width =
                "0%";

            predictionIcon.textContent =
                "⚠️";


            turnAllAppliancesOff();

            updateBCICommand("NONE");

        }

    }
);


// ============================================================
// NEUROHOME 3D NEURAL ENVIRONMENT
// Three.js
// ============================================================

const scene = new THREE.Scene();


// ============================================================
// CAMERA
// ============================================================

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(
    0,
    1,
    18
);


// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setClearColor(
    0x000000,
    0
);


// ============================================================
// ADD CANVAS
// ============================================================

renderer.domElement.id = "neuro3d";

document.body.prepend(
    renderer.domElement
);


// ============================================================
// NEURAL NETWORK
// ============================================================

const neuralGroup =
    new THREE.Group();

scene.add(
    neuralGroup
);


// ============================================================
// CREATE NEURAL NODES
// ============================================================

const nodeCount = 140;

const nodes = [];

const nodeMaterial =
    new THREE.MeshBasicMaterial({
        color: 0x66e8ff
    });


for (let i = 0; i < nodeCount; i++) {

    const angle =
        Math.random() * Math.PI * 2;

    const radius =
        3.5 + Math.random() * 3.5;

    const x =
        Math.cos(angle) *
        radius;

    const y =
        (Math.random() - 0.5) *
        7;

    const z =
        Math.sin(angle) *
        radius;


    const geometry =
        new THREE.SphereGeometry(
            0.055 +
            Math.random() * 0.045,
            8,
            8
        );


    const node =
        new THREE.Mesh(
            geometry,
            nodeMaterial
        );


    node.position.set(
        x,
        y,
        z
    );


    neuralGroup.add(
        node
    );

    nodes.push(
        node
    );
}


// ============================================================
// NEURAL CONNECTIONS
// ============================================================

const connectionMaterial =
    new THREE.LineBasicMaterial({
        color: 0x35cfff,
        transparent: true,
        opacity: 0.16
    });


for (let i = 0; i < nodes.length; i++) {

    const nodeA =
        nodes[i];


    for (
        let j = i + 1;
        j < nodes.length;
        j++
    ) {

        const nodeB =
            nodes[j];


        const distance =
            nodeA.position.distanceTo(
                nodeB.position
            );


        // Only connect nearby neurons

        if (distance < 2.4) {

            const points = [
                nodeA.position.clone(),
                nodeB.position.clone()
            ];


            const geometry =
                new THREE.BufferGeometry()
                    .setFromPoints(points);


            const line =
                new THREE.Line(
                    geometry,
                    connectionMaterial
                );


            neuralGroup.add(
                line
            );

        }
    }
}


// ============================================================
// NEURAL CORE
// ============================================================

const coreGeometry =
    new THREE.SphereGeometry(
        1.2,
        32,
        32
    );


const coreMaterial =
    new THREE.MeshBasicMaterial({
        color: 0x168dff,
        transparent: true,
        opacity: 0.08
    });


const neuralCore =
    new THREE.Mesh(
        coreGeometry,
        coreMaterial
    );


neuralGroup.add(
    neuralCore
);


// ============================================================
// OUTER GLOW RINGS
// ============================================================

for (let i = 0; i < 3; i++) {

    const ringGeometry =
        new THREE.TorusGeometry(
            2.2 + i * 0.55,
            0.012,
            8,
            100
        );


    const ringMaterial =
        new THREE.MeshBasicMaterial({
            color:
                i === 1
                    ? 0x4d7cff
                    : 0x42d9ff,

            transparent: true,

            opacity:
                0.22 -
                i * 0.04
        });


    const ring =
        new THREE.Mesh(
            ringGeometry,
            ringMaterial
        );


    ring.rotation.x =
        Math.random() * Math.PI;

    ring.rotation.y =
        Math.random() * Math.PI;

    neuralGroup.add(
        ring
    );
}


// ============================================================
// 3D FLOOR GRID
// ============================================================

const gridHelper =
    new THREE.GridHelper(
        80,
        50,
        0x168dff,
        0x0b3150
    );


gridHelper.position.y =
    -5;


gridHelper.material.transparent =
    true;

gridHelper.material.opacity =
    0.22;


scene.add(
    gridHelper
);


// ============================================================
// FLOATING PARTICLES
// ============================================================

const particleCount =
    900;


const particleGeometry =
    new THREE.BufferGeometry();


const particlePositions =
    new Float32Array(
        particleCount * 3
    );


for (
    let i = 0;
    i < particleCount;
    i++
) {

    particlePositions[i * 3] =
        (Math.random() - 0.5) * 45;

    particlePositions[i * 3 + 1] =
        (Math.random() - 0.5) * 28;

    particlePositions[i * 3 + 2] =
        (Math.random() - 0.5) * 35;
}


particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        particlePositions,
        3
    )
);


const particleMaterial =
    new THREE.PointsMaterial({

        color: 0x59ddff,

        size: 0.035,

        transparent: true,

        opacity: 0.65
    });


const particles =
    new THREE.Points(
        particleGeometry,
        particleMaterial
    );


scene.add(
    particles
);


// ============================================================
// MOUSE MOVEMENT
// ============================================================

let mouseX = 0;
let mouseY = 0;

let targetMouseX = 0;
let targetMouseY = 0;


window.addEventListener(
    "mousemove",
    (event) => {

        targetMouseX =
            (event.clientX /
                window.innerWidth -
                0.5);

        targetMouseY =
            (event.clientY /
                window.innerHeight -
                0.5);

    }
);


// ============================================================
// SCROLL MOVEMENT
// ============================================================

let targetScroll = 0;
let currentScroll = 0;


window.addEventListener(
    "scroll",
    () => {

        targetScroll =
            window.scrollY;

    },
    { passive: true }
);


// ============================================================
// ANIMATION
// ============================================================

function animateNeuro3D() {

    requestAnimationFrame(
        animateNeuro3D
    );


    // Smooth mouse movement

    mouseX +=
        (targetMouseX -
            mouseX) * 0.035;

    mouseY +=
        (targetMouseY -
            mouseY) * 0.035;


    // Smooth scrolling

    currentScroll +=
        (targetScroll -
            currentScroll) * 0.04;


    // --------------------------------------------------------
    // NEURAL NETWORK ROTATION
    // --------------------------------------------------------

    neuralGroup.rotation.y +=
        0.0015;


    neuralGroup.rotation.y +=
        mouseX * 0.0015;


    neuralGroup.rotation.x =
        mouseY * 0.12;


    // --------------------------------------------------------
    // SCROLL DEPTH
    // --------------------------------------------------------

    neuralGroup.position.y =
        -currentScroll * 0.002;


    neuralGroup.position.z =
        Math.sin(
            currentScroll * 0.002
        ) * 1.5;


    // --------------------------------------------------------
    // GRID MOVEMENT
    // --------------------------------------------------------

    gridHelper.position.z =
        (currentScroll * 0.025) % 2;


    gridHelper.rotation.y =
        mouseX * 0.02;


    // --------------------------------------------------------
    // PARTICLES
    // --------------------------------------------------------

    particles.rotation.y +=
        0.00025;


    particles.rotation.x =
        mouseY * 0.025;


    particles.position.x =
        mouseX * 0.8;

    particles.position.y =
        -currentScroll * 0.001;


    // --------------------------------------------------------
    // CORE PULSE
    // --------------------------------------------------------

    const pulse =
        1 +
        Math.sin(
            performance.now() * 0.002
        ) * 0.08;


    neuralCore.scale.set(
        pulse,
        pulse,
        pulse
    );


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    renderer.render(
        scene,
        camera
    );
}


animateNeuro3D();


// ============================================================
// RESPONSIVE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);