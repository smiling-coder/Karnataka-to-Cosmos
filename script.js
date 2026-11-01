import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TEXTURES = {
  earth: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
  earthNormal: "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",
  earthSpecular: "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg",
  moon: "https://threejs.org/examples/textures/planets/moon_1024.jpg",
  mars: "https://threejs.org/examples/textures/planets/mars_1k_color.jpg",
  jupiter: "https://threejs.org/examples/textures/planets/jupiter.jpg"
};

function makeRenderer(container, alpha = true) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);
  return renderer;
}

function addStarfield(scene, count = 1800, radius = 95) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.35 + Math.random() * 0.65);
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * s * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xc5e4ff, size: 0.12, transparent: true, opacity: 0.8, sizeAttenuation: true });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

function addSatellite(scene, radius, angle, scale = 1) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * scale, 0.2 * scale, 0.2 * scale),
    new THREE.MeshStandardMaterial({ color: 0xd9e6f5, metalness: 0.8, roughness: 0.28 })
  );
  group.add(body);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e6cb1, metalness: 0.5, roughness: 0.35, emissive: 0x082b58 });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.43 * scale, 0.025 * scale, 0.2 * scale), panelMat);
    panel.position.x = side * 0.32 * scale;
    group.add(panel);
  }
  const light = new THREE.PointLight(0x68caff, 0.35, 1.5);
  light.position.set(0, 0.15, 0);
  group.add(light);
  const pivot = new THREE.Group();
  pivot.rotation.y = angle;
  group.position.set(radius, 0, 0);
  pivot.add(group);
  pivot.userData.orbitSpeed = 0.08 + Math.random() * 0.07;
  pivot.userData.satellite = group;
  scene.add(pivot);
  return pivot;
}

function createEarthScene() {
  const container = $("#heroCanvas");
  if (!container || !window.WebGLRenderingContext) return null;
  let renderer;
  try { renderer = makeRenderer(container, true); } catch (error) { console.warn("WebGL unavailable:", error); return null; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 500);
  camera.position.set(0, 0.7, 7.4);
  const ambient = new THREE.AmbientLight(0x7b9bc2, 1.25);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb7e5ff, 3.1);
  keyLight.position.set(-4, 2.5, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x268cff, 2.5);
  rimLight.position.set(4, -1, -4);
  scene.add(rimLight);
  const stars = addStarfield(scene, 2300, 110);
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const earthGeo = new THREE.SphereGeometry(2.05, 72, 72);
  const earthMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 14, specular: new THREE.Color(0x254b70) });
  const earth = new THREE.Mesh(earthGeo, earthMat);
  earthGroup.add(earth);
  loader.load(TEXTURES.earth, tex => { tex.colorSpace = THREE.SRGBColorSpace; earth.material.map = tex; earth.material.needsUpdate = true; }, undefined, () => console.warn("Earth texture failed to load."));
  loader.load(TEXTURES.earthNormal, tex => { earth.material.normalMap = tex; earth.material.normalScale.set(0.45, 0.45); earth.material.needsUpdate = true; });
  loader.load(TEXTURES.earthSpecular, tex => { earth.material.specularMap = tex; earth.material.needsUpdate = true; });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.12, 64, 64), new THREE.MeshBasicMaterial({ color: 0x2c9bff, side: THREE.BackSide, transparent: true, opacity: 0.22 }));
  earthGroup.add(atmosphere);
  const cloudMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(2.075, 64, 64), cloudMat);
  earthGroup.add(clouds);
  loader.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png", tex => { cloudMat.map = tex; cloudMat.alphaMap = tex; cloudMat.needsUpdate = true; });
  // Satellites are intentionally illustrative meshes; these are NOT real live satellite positions.
  const satellites = [addSatellite(earthGroup, 2.58, 0.1, 0.8), addSatellite(earthGroup, 2.92, 2.4, 0.7), addSatellite(earthGroup, 3.28, 4.6, 0.65)];
  const orbitLines = [];
  [2.58, 2.92, 3.28].forEach((radius, index) => {
    const points = [];
    for (let i = 0; i <= 180; i++) {
      const a = i / 180 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: index === 0 ? 0x6dcfff : 0x355a7c, transparent: true, opacity: 0.45 }));
    earthGroup.add(line); orbitLines.push(line);
  });
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false; controls.enableZoom = true; controls.minDistance = 5; controls.maxDistance = 10;
  controls.enableDamping = true; controls.dampingFactor = 0.04; controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = 0.24;
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  };
  window.addEventListener("resize", resize);
  const clock = new THREE.Clock();
  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    earth.rotation.y += dt * 0.035;
    clouds.rotation.y += dt * 0.045;
    satellites.forEach(s => { s.rotation.y += dt * s.userData.orbitSpeed; s.userData.satellite.rotation.z += dt * 0.22; });
    stars.rotation.y += dt * 0.003;
    controls.update(); renderer.render(scene, camera);
  }
  animate();
  return { renderer, scene, camera, controls, dispose() { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); controls.dispose(); renderer.dispose(); } };
}

const planetDescriptions = {
  earth: { name: "Earth", kicker: "HOME PLANET", description: "Our pale blue dot — a living world and the starting point for every journey into space.", texture: TEXTURES.earth, radius: 1.25, color: 0x2779bb, tag: "3D VISUALIZATION" },
  moon: { name: "Moon", kicker: "EARTH'S NATURAL SATELLITE", description: "A nearby world that preserves clues to the early history of the Earth–Moon system.", texture: TEXTURES.moon, radius: 0.72, color: 0x999eaa, tag: "3D VISUALIZATION" },
  mars: { name: "Mars", kicker: "THE RED PLANET", description: "A rocky world with ancient landscapes, giant volcanoes and evidence of a watery past.", texture: TEXTURES.mars, radius: 0.9, color: 0xb45e43, tag: "3D VISUALIZATION" },
  jupiter: { name: "Jupiter", kicker: "GAS GIANT", description: "The Solar System's largest planet, known for powerful storms and many moons.", texture: TEXTURES.jupiter, radius: 1.55, color: 0xc8a47d, tag: "3D VISUALIZATION" }
};

function createPlanetScene() {
  const container = $("#solarCanvas");
  if (!container || !window.WebGLRenderingContext) return null;
  let renderer;
  try { renderer = makeRenderer(container, true); } catch (error) { console.warn("WebGL unavailable:", error); return null; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 300);
  camera.position.set(0, 1.2, 6.4);
  scene.add(new THREE.AmbientLight(0x8095b6, 1.6));
  const key = new THREE.DirectionalLight(0xe2f4ff, 3.3); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x268fff, 25, 20); rim.position.set(4, -1, -2); scene.add(rim);
  const stars = addStarfield(scene, 1500, 75);
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin("anonymous");
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
  const planet = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ color: 0x2c8ed4, roughness: 0.85 }));
  scene.add(planet);
  let currentPlanet = "earth";
  let loadToken = 0;
  const orbitGroup = new THREE.Group(); scene.add(orbitGroup);
  for (let r = 2.0; r <= 3.9; r += 0.62) {
    const pts = [];
    for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x385879, transparent: true, opacity: 0.3 })));
  }
  const satellites = [addSatellite(scene, 2.1, 0.7, 0.75), addSatellite(scene, 2.8, 2.2, 0.55)];
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05; controls.enablePan = false; controls.minDistance = 3.1; controls.maxDistance = 11; controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = 0.45;
  function selectPlanet(keyName, animateCamera = true) {
    if (keyName === "reset") {
      currentPlanet = "earth"; camera.position.set(0, 1.2, 6.4); controls.target.set(0, 0, 0); controls.update(); keyName = "earth";
    }
    const data = planetDescriptions[keyName] || planetDescriptions.earth;
    currentPlanet = keyName;
    const token = ++loadToken;
    planet.scale.setScalar(data.radius);
    planet.material.color.setHex(data.color);
    planet.material.map = null; planet.material.needsUpdate = true;
    loader.load(data.texture, texture => {
      if (token !== loadToken) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      planet.material.map = texture;
      planet.material.color.setHex(0xffffff);
      planet.material.needsUpdate = true;
    }, undefined, () => console.warn(`Texture unavailable for ${data.name}; using fallback material.`));
    $("#planetInfo").innerHTML = `<span class="planet-kicker">${data.kicker}</span><h3>${data.name}</h3><p>${data.description}</p><span class="data-tag">${data.tag}</span>`;
    $("#sceneStatus").textContent = `SCENE: ${data.name.toUpperCase()} // ORBITS ARE ILLUSTRATIVE`;
    document.querySelectorAll(".planet-button").forEach(btn => btn.classList.toggle("active", btn.dataset.planet === keyName));
    if (animateCamera && keyName !== "earth") {
      const distance = Math.max(4.2, data.radius * 3.7);
      camera.position.set(distance * 0.35, distance * 0.2, distance);
    }
  }
  document.querySelectorAll(".planet-button").forEach(btn => btn.addEventListener("click", () => selectPlanet(btn.dataset.planet)));
  const resize = () => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
  window.addEventListener("resize", resize);
  const clock = new THREE.Clock(); let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    planet.rotation.y += dt * (currentPlanet === "earth" ? 0.06 : 0.025);
    orbitGroup.rotation.y += dt * 0.025;
    satellites.forEach(s => { s.rotation.y += dt * s.userData.orbitSpeed; s.userData.satellite.rotation.z += dt * 0.15; });
    stars.rotation.y += dt * 0.002;
    controls.update(); renderer.render(scene, camera);
  }
  selectPlanet("earth", false); animate();
  return { dispose() { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); controls.dispose(); renderer.dispose(); } };
}

// NASA public APIs: APOD and NeoWs. DEMO_KEY has shared, limited rate quotas.
// The API cards are real fetched data; 3D satellites/orbits are not real-time tracking.
const NASA_API_KEY = "DEMO_KEY";
const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_API_KEY)}`;
const NEO_URL = (date) => `https://api.nasa.gov/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${encodeURIComponent(NASA_API_KEY)}`;

function utcDateString(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function shortNumber(value) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value); }
function setStatus(message, isError = false) {
  const el = $("#apiStatus");
  el.textContent = message;
  el.style.color = isError ? "#ffadad" : "";
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
async function loadApod() {
  const imageBox = $("#apodImage");
  $("#apodTitle").textContent = "Loading astronomy picture…";
  $("#apodDescription").textContent = "Fetching NASA's Astronomy Picture of the Day.";
  try {
    const response = await fetch(APOD_URL);
    if (!response.ok) throw new Error(`NASA APOD returned HTTP ${response.status}`);
    const data = await response.json();
    $("#apodTitle").textContent = data.title || "Astronomy Picture of the Day";
    $("#apodDescription").textContent = (data.explanation || "NASA's daily astronomy feature.").slice(0, 360) + ((data.explanation || "").length > 360 ? "…" : "");
    $("#apodLink").href = data.url || "https://apod.nasa.gov/apod/astropix.html";
    imageBox.innerHTML = "";
    if (data.media_type === "image" && data.url) {
      const img = document.createElement("img");
      img.src = data.url; img.alt = data.title || "NASA astronomy picture"; img.loading = "lazy";
      img.onerror = () => { imageBox.textContent = "NASA image could not be loaded. Use the NASA APOD link below."; };
      imageBox.appendChild(img);
    } else if (data.media_type === "video" && data.url) {
      const link = document.createElement("a"); link.href = data.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.className = "media-badge"; link.textContent = "Open today's NASA video ↗";
      imageBox.textContent = "Today's NASA APOD is a video."; imageBox.appendChild(link);
    } else {
      imageBox.textContent = "NASA media is unavailable for this item.";
    }
    const badge = document.createElement("span"); badge.className = "media-badge"; badge.textContent = `NASA APOD · ${data.date || "LATEST"}`; imageBox.appendChild(badge);
    return true;
  } catch (error) {
    console.error(error);
    $("#apodTitle").textContent = "NASA APOD is temporarily unavailable";
    $("#apodDescription").textContent = "Check your internet connection or try again later. The live API may be rate-limited.";
    imageBox.textContent = "Live data unavailable";
    return false;
  }
}
async function loadNeo() {
  const date = utcDateString();
  $("#neoList").innerHTML = '<p class="placeholder-line">Requesting near-Earth object data…</p>';
  try {
    const response = await fetch(NEO_URL(date));
    if (!response.ok) throw new Error(`NASA NeoWs returned HTTP ${response.status}`);
    const data = await response.json();
    const objects = data.near_earth_objects?.[date] || [];
    const hazardous = objects.filter(obj => obj.is_potentially_hazardous_asteroid);
    $("#neoCount").textContent = shortNumber(objects.length);
    $("#neoHazard").textContent = shortNumber(hazardous.length);
    const sorted = [...objects].sort((a, b) => {
      const aDist = Number(a.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity);
      const bDist = Number(b.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity);
      return aDist - bDist;
    }).slice(0, 5);
    $("#neoList").innerHTML = "";
    if (!sorted.length) {
      $("#neoList").innerHTML = '<p class="placeholder-line">No objects were returned for this UTC date.</p>';
    }
    sorted.forEach(obj => {
      const approach = obj.close_approach_data?.[0] || {};
      const km = Number(approach.miss_distance?.kilometers);
      const row = document.createElement("div");
      row.className = "neo-row";
      const name = document.createElement("span"); name.className = "neo-name"; name.textContent = obj.name || "Unnamed object";
      const meta = document.createElement("span"); meta.className = "neo-meta";
      meta.textContent = Number.isFinite(km) ? `${shortNumber(km)} km` : "Distance unavailable";
      if (obj.is_potentially_hazardous_asteroid) meta.classList.add("hazard-tag");
      row.append(name, meta); $("#neoList").appendChild(row);
    });
    const dateLabel = document.createElement("p"); dateLabel.className = "placeholder-line"; dateLabel.textContent = `Feed date: ${date} (UTC)`;
    $("#neoList").appendChild(dateLabel);
    return true;
  } catch (error) {
    console.error(error);
    $("#neoCount").textContent = "—"; $("#neoHazard").textContent = "—";
    $("#neoList").innerHTML = '<p class="placeholder-line">NASA NeoWs data is unavailable right now. Check your connection or retry later.</p>';
    return false;
  }
}
async function refreshNasaData() {
  const button = $("#refreshData");
  button.disabled = true; button.textContent = "Refreshing…";
  setStatus("Requesting NASA API data…");
  const [apodOk, neoOk] = await Promise.all([loadApod(), loadNeo()]);
  const fetchedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (apodOk && neoOk) setStatus(`NASA API data loaded · checked ${fetchedAt}. API quotas may limit refreshes.`);
  else if (apodOk || neoOk) setStatus(`Some NASA data loaded · checked ${fetchedAt}. One endpoint may be rate-limited.`, true);
  else setStatus("NASA API data could not be loaded. The 3D simulation still works; try again later.", true);
  button.disabled = false; button.textContent = "Refresh data ↻";
}
$("#refreshData").addEventListener("click", refreshNasaData);
$("#menuButton").addEventListener("click", () => {
  const nav = $("#mobileNav");
  nav.classList.toggle("open");
  $("#menuButton").setAttribute("aria-expanded", String(nav.classList.contains("open")));
});
document.querySelectorAll("#mobileNav a").forEach(a => a.addEventListener("click", () => {
  $("#mobileNav").classList.remove("open"); $("#menuButton").setAttribute("aria-expanded", "false");
}));

// Boot screen is decorative only; never block the page if an API fails.
window.addEventListener("load", () => setTimeout(() => $("#bootScreen")?.classList.add("done"), 700));
createEarthScene();
createPlanetScene();
refreshNasaData();
