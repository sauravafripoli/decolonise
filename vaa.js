import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const QUESTIONS = [
    { axis: 'x', dir: 1, text: 'Development systems should be fundamentally transformed, not just reformed.' },
    { axis: 'x', dir: -1, text: 'Incremental policy reform is the most realistic path to decolonising development.' },
    { axis: 'y', dir: 1, text: 'Individual agency and mindset shifts are central to decolonising development.' },
    { axis: 'y', dir: -1, text: 'Collective political action matters more than individual action.' },
    { axis: 'z', dir: 1, text: 'Global South knowledge systems should lead development frameworks.' },
    { axis: 'z', dir: -1, text: 'Western institutions should remain central to global development coordination.' }
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
    if (miniRenderer?.domElement?.parentNode) {
        miniRenderer.domElement.parentNode.removeChild(miniRenderer.domElement);
    }

    miniScene = new THREE.Scene();
    miniScene.background = new THREE.Color(0xffffff);

    miniCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    miniCamera.position.set(18, 14, 18);
    miniCamera.lookAt(0, 0, 0);

    miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    miniRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(miniRenderer.domElement);

    miniScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(8, 12, 10);
    miniScene.add(light);

    const axisMat = new THREE.LineBasicMaterial({ color: 0xcbd5e0 });
    const axisPoints = [
        [new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)],
        [new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 10, 0)],
        [new THREE.Vector3(0, 0, -10), new THREE.Vector3(0, 0, 10)]
    ];

    axisPoints.forEach(([a, b]) => {
        const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
        miniScene.add(new THREE.Line(geom, axisMat));
    });

    const addPoint = (x, y, z, color = 0x3182ce, size = 0.32) => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(size, 16, 16),
            new THREE.MeshStandardMaterial({ color })
        );
        mesh.position.set(x, y, z);
        miniScene.add(mesh);
    };

    addPoint(userPos.x, userPos.y, userPos.z, 0x1d4ed8, 0.38);
    closest.forEach((d) => addPoint(d.x ?? 0, d.y ?? 0, d.z ?? 0, 0x2563eb, 0.24));
    opposite.forEach((d) => addPoint(d.x ?? 0, d.y ?? 0, d.z ?? 0, 0xb91c1c, 0.24));

    const renderLoop = () => {
        miniFrameId = requestAnimationFrame(renderLoop);
        miniScene.rotation.y += 0.005;
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
        <ul>${closest.map((a) => `<li><b>${a.author || 'Unknown'}</b> (${a.shortTitle || 'Untitled'})</li>`).join('')}</ul>
        <p><b>Opposite-position publications:</b></p>
        <ul>${opposite.map((a) => `<li><b>${a.author || 'Unknown'}</b> (${a.shortTitle || 'Untitled'})</li>`).join('')}</ul>
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
