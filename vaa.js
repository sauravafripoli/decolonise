import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const QUESTIONS = [
   // X Axis: Transformative (+) vs Reform (-)
                { axis: 'x', dir: 1, text: "\"The idea should not be to replace existing donor countries with new donor countries, but to replace the system of aid itself with more equitable relationships.\" (Khan, 2024)" },
                { axis: 'x', dir: 1, text: "\"DEFUNDING AND DISSOLVING these institutions is the most effective step towards building a new system that is truly based on equity and justice...If the goal of aid is about ending aid, then INGOs should have an exit plan and develop new metrics of success for their organizations that are centered around devolving power, money and voice to local communities, organizations and movements.\" (Ali and Romain Murphy, 2020)" },
                { axis: 'x', dir: -1, text: "\"This is not a call to reduce or end this assistance but to repurpose it in ways that build developing countries’ self-sufficiency and local accountability.\" (Adeyi, 2023)" },
                { axis: 'x', dir: -1, text: "\"International donors should step up their efforts to reform their funding and reporting structures... 25 per cent of aid per country is allocated directly to local aid organisations... then gradually increased to 50 per cent.\" (Meininghaus et al., 2024)" },

                // Y Axis: Individual/Market (+) vs Collective/State (-)
                // Note: Positive = Individual/Market, Negative = Collective/State
                { axis: 'y', dir: 1, text: "\"Addressing colonial mindsets... is not only an individual task, but also a responsibility of development organisations.\" (Kapazoglou et al., 2022)" },
                { axis: 'y', dir: -1, text: "\"Development must be anchored in the sense of relationality, community spirit, solidarity, harmony with nature and pluriversity.\" (Caixeta and Dos Santos, 2022)" },
                { axis: 'y', dir: -1, text: "\"Accountability to the communities we serve starts with questioning our own complicity in poverty, injustice and disempowerment.\" (Ali and Romain Murphy, 2020)" },
                { axis: 'y', dir: -1, text: "\"Reforms in development cooperation... have always remained within the limits of the institutional setting.\" (Ziai, 2023)" },

                // Z Axis: Global South (+) vs Western (-)
                { axis: 'z', dir: 1, text: "\"The knowledge of the experts... can be exported world-wide and applied in varying contexts... Local knowledge, in contrast, is just that, local. Universality is the privilege of this modern mode of thought. It is this privilege which has enabled this mode of knowing to confidently override local ways of knowing and doing, secure in its ability to deliver superior results.\" (WACSI, 2023)" },
                { axis: 'z', dir: 1, text: "\"The dismissal of research from the Global South perpetuates disparities in knowledge production and dissemination... reinforces a hierarchical system where knowledge generated in the Global North is often privileged over that from the Global South.\" (Webb et al., 2024)" },
                { axis: 'z', dir: 1, text: "\"Facilitating access to local knowledge and expertise is considered the first priority... the impact of development programmes largely depends on the effective inclusion of endogenous knowledge and local expertise, in order to increase the ownership and sustainability of the final project.\" (WACSI, 2023)" },
                { axis: 'z', dir: -1, text: "\"The term restitution was inextricably bound up with a view of Belgian colonialism as a system of exploitation... use of language such as ‘development cooperation’, then, also reinforced an appearance of neutrality in a relationship that was plagued by historical inequalities.\" (Van Beurden, 2015)" }   
];

const state = {
    currentQuestionIndex: 0,
    questions: [],
    scores: { x: 0, y: 0, z: 0 },
    dataSource: []
};

let miniRenderer = null;
let miniScene = null;
let miniCamera = null;
let miniFrameId = null;
let miniRotationPaused = false;
let miniRotationSpeed = 0.005;

function shuffle(input) {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function nearestPublications(data, target, count = 3) {
    return [...data]
        .map((d) => {
            const dist = Math.sqrt(
                Math.pow((d.x ?? 0) - target.x, 2) +
                Math.pow((d.y ?? 0) - target.y, 2) +
                Math.pow((d.z ?? 0) - target.z, 2)
            );
            return { ...d, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, count);
}

function showScreen(UI, target) {
    if (UI.vaaStartScreen) UI.vaaStartScreen.style.display = target === 'start' ? 'block' : 'none';
    if (UI.vaaQuizScreen) UI.vaaQuizScreen.style.display = target === 'quiz' ? 'block' : 'none';
    if (UI.vaaResultScreen) UI.vaaResultScreen.style.display = target === 'result' ? 'block' : 'none';
}

function renderQuestion(UI) {
    const q = state.questions[state.currentQuestionIndex];
    if (!q) return;
    UI.vaaQuestionText.textContent = q.text;
    UI.vaaQCurrent.textContent = String(state.currentQuestionIndex + 1);
    UI.vaaQTotal.textContent = String(state.questions.length);
}

function initMiniVaa3D(UI, userPos, closest, opposite) {
    const container = UI.vaaMiniVisContainer;
    if (!container) return;

    if (miniFrameId) cancelAnimationFrame(miniFrameId);
    container.innerHTML = '';
    miniRenderer = null;

    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.bottom = '10px';
    controlsDiv.style.right = '10px';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '5px';
    controlsDiv.style.zIndex = '10';

    const btnStyle = 'width: 30px; height: 30px; border-radius: 4px; border: 1px solid #cbd5e0; background: white; color: #4a5568; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);';
    controlsDiv.innerHTML = `
        <button id="mini-btn-left" style="${btnStyle}" title="Rotate Left">↺</button>
        <button id="mini-btn-pause" style="${btnStyle}" title="Pause/Play">⏸</button>
        <button id="mini-btn-right" style="${btnStyle}" title="Rotate Right">↻</button>
    `;
    container.appendChild(controlsDiv);

    miniRotationPaused = false;
    miniRotationSpeed = 0.005;

    const leftBtn = controlsDiv.querySelector('#mini-btn-left');
    const rightBtn = controlsDiv.querySelector('#mini-btn-right');
    const pauseBtn = controlsDiv.querySelector('#mini-btn-pause');

    if (leftBtn) leftBtn.onclick = () => { miniRotationSpeed = 0.005; miniRotationPaused = false; if (pauseBtn) pauseBtn.textContent = '⏸'; };
    if (rightBtn) rightBtn.onclick = () => { miniRotationSpeed = -0.005; miniRotationPaused = false; if (pauseBtn) pauseBtn.textContent = '⏸'; };
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            miniRotationPaused = !miniRotationPaused;
            pauseBtn.textContent = miniRotationPaused ? '▶' : '⏸';
        };
    }

    miniScene = new THREE.Scene();
    miniScene.background = new THREE.Color(0xffffff);

    miniCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    miniCamera.position.set(20, 20, 20);
    miniCamera.lookAt(0, 0, 0);

    miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    miniRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(miniRenderer.domElement);

    const planeSize = 20;
    const planeOpacity = 0.5;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);

    const planeX = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xfeb2b2, transparent: true, opacity: planeOpacity, side: THREE.DoubleSide, depthWrite: true }));
    planeX.rotation.y = Math.PI / 2;
    miniScene.add(planeX);

    const planeY = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x9ae6b4, transparent: true, opacity: planeOpacity, side: THREE.DoubleSide, depthWrite: true }));
    planeY.rotation.x = Math.PI / 2;
    miniScene.add(planeY);

    const planeZ = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x90cdf4, transparent: true, opacity: planeOpacity, side: THREE.DoubleSide, depthWrite: true }));
    miniScene.add(planeZ);

    miniScene.add(new THREE.AxesHelper(10));

    const boxGeo = new THREE.BoxGeometry(20, 20, 20);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    miniScene.add(new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: 0xe2e8f0 })));

    const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.95
        })
    );
    beacon.position.set(userPos.x, userPos.y, userPos.z);
    miniScene.add(beacon);

    const createMiniMesh = (diamond, color) => {
        const category = Array.isArray(diamond.category) ? diamond.category : [];
        let geometry;
        if (category.includes('NGOs/Civil Society')) geometry = new THREE.TetrahedronGeometry(0.5);
        else if (category.includes('Governments/Policy Statements')) geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        else geometry = new THREE.SphereGeometry(0.4, 16, 16);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color }));
        mesh.position.set(diamond.x ?? 0, diamond.y ?? 0, diamond.z ?? 0);
        if (category.includes('Governments/Policy Statements')) {
            mesh.rotation.z = Math.PI / 4;
            mesh.rotation.x = Math.PI / 4;
        }
        return mesh;
    };

    closest.forEach((d) => miniScene.add(createMiniMesh(d, 0x3182ce)));
    opposite.forEach((d) => miniScene.add(createMiniMesh(d, 0xc53030)));

    miniScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    miniScene.add(dirLight);

    const renderLoop = () => {
        miniFrameId = requestAnimationFrame(renderLoop);
        if (!miniRotationPaused) miniScene.rotation.y += miniRotationSpeed;
        const time = Date.now() * 0.003;
        beacon.material.emissiveIntensity = 0.5 + Math.sin(time) * 0.3;
        miniRenderer.render(miniScene, miniCamera);
    };

    renderLoop();
}

function finish(UI) {
    showScreen(UI, 'result');

    const factor = 10 / 4;
    const finalX = Math.max(-10, Math.min(10, Math.round((state.scores.x * factor) * 10) / 10));
    const finalY = Math.max(-10, Math.min(10, Math.round((state.scores.y * factor) * 10) / 10));
    const finalZ = Math.max(-10, Math.min(10, Math.round((state.scores.z * factor) * 10) / 10));

    const closest = nearestPublications(state.dataSource, { x: finalX, y: finalY, z: finalZ });
    const opposite = nearestPublications(state.dataSource, { x: -finalX, y: -finalY, z: -finalZ });

    UI.vaaResultText.innerHTML = `
        <p><b>Your position:</b> X ${finalX > 0 ? '+' : ''}${finalX}, Y ${finalY > 0 ? '+' : ''}${finalY}, Z ${finalZ > 0 ? '+' : ''}${finalZ}</p>
        <p><b>Closest publications:</b></p>
        <ul class="vaa-list vaa-closest">${closest.map((a) => `<li><b>${a.author || 'Unknown'}</b> <span style="color: #4a5568;">(${a.shortTitle || 'Untitled'})</span></li>`).join('')}</ul>
        <p style="margin-top: 20px;"><b>Opposite-position publications:</b></p>
        <ul class="vaa-list vaa-opposite">${opposite.map((a) => `<li><b>${a.author || 'Unknown'}</b> <span style="color: #4a5568;">(${a.shortTitle || 'Untitled'})</span></li>`).join('')}</ul>
        <div style="background-color:#fffbea; border-left: 4px solid #ecc94b; padding: 10px; margin-top:25px; font-size: 0.9em; color: #744210;">
            <b>Invitation:</b> Explore adjacent and opposite positions in this space to challenge or refine your view.
        </div>
    `;

    initMiniVaa3D(UI, { x: finalX, y: finalY, z: finalZ }, closest, opposite);
}

function answer(UI, value) {
    const q = state.questions[state.currentQuestionIndex];
    if (!q) return;

    state.scores[q.axis] += value * q.dir;
    state.currentQuestionIndex += 1;

    if (state.currentQuestionIndex >= state.questions.length) finish(UI);
    else renderQuestion(UI);
}

function start(UI) {
    state.currentQuestionIndex = 0;
    state.questions = shuffle(QUESTIONS).slice(0, 6);
    state.scores = { x: 0, y: 0, z: 0 };
    showScreen(UI, 'quiz');
    renderQuestion(UI);
}

export function initVAA(UI, diamondsData) {
    if (!UI.vaaContainer) return;

    state.dataSource = diamondsData;
    showScreen(UI, 'start');

    UI.btnStartVAA?.addEventListener('click', () => start(UI));
    UI.btnRestartVAA?.addEventListener('click', () => start(UI));

    UI.vaaOptionButtons?.forEach((btn) => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value, 10);
            answer(UI, Number.isNaN(value) ? 0 : value);
        });
    });
}
