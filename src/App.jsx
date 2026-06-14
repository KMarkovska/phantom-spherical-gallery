import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import {
  ArrowLeft,
  ArrowUpRight,
  CirclesFour,
  Ghost,
  List,
  SpeakerSimpleSlash,
  X,
} from "@phosphor-icons/react";

const projects = [
  { title: "Signal Bloom", client: "Aperture", year: "2026", tags: ["EXPERIENCE", "AI", "FILM"], image: "/assets/orb.png" },
  { title: "Quiet Hardware", client: "Noma", year: "2025", tags: ["PRODUCT", "3D", "BRAND"], image: "/assets/chrome.png" },
  { title: "Blue Hour", client: "Common Ground", year: "2025", tags: ["CAMPAIGN", "SOCIAL", "FILM"], image: "/assets/bottles.png" },
  { title: "Double Take", client: "A24", year: "2024", tags: ["FILM", "EXPERIENCE", "WEBGL"], image: "/assets/portrait.png" },
  { title: "Folded Futures", client: "Google", year: "2024", tags: ["COMMUNICATION", "CRAFT", "AI"], image: "/assets/paper.png" },
  { title: "Afterlight", client: "Arc Studio", year: "2025", tags: ["IDENTITY", "MOTION", "CAMPAIGN"], image: "/assets/embers.png" },
  { title: "Soft Systems", client: "The New Co.", year: "2023", tags: ["WEBSITE", "PLATFORM", "DESIGN"], image: "/assets/orb.png" },
  { title: "Material Memory", client: "Monocle", year: "2024", tags: ["EDITORIAL", "3D", "STORY"], image: "/assets/chrome.png" },
  { title: "Electric Weather", client: "Diageo", year: "2025", tags: ["CAMPAIGN", "PRODUCT", "SOCIAL"], image: "/assets/bottles.png" },
  { title: "Human Error", client: "Netflix", year: "2025", tags: ["ENTERTAINMENT", "FILM", "WEB"], image: "/assets/portrait.png" },
  { title: "Paper Protocol", client: "DeepMind", year: "2023", tags: ["AI", "RESEARCH", "BRAND"], image: "/assets/paper.png" },
  { title: "Burning Index", client: "Nike", year: "2024", tags: ["CULTURE", "MOTION", "DIGITAL"], image: "/assets/embers.png" },
];

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function makeCardTexture(project, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 594;
  const ctx = canvas.getContext("2d");

  const draw = (image) => {
    ctx.fillStyle = "#020202";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    ctx.fillStyle = "#f4f4f0";
    ctx.font = "500 21px 'Courier New', monospace";
    ctx.fillText(project.client.toUpperCase(), 22, 34);
    ctx.textAlign = "right";
    ctx.fillText(project.title.toUpperCase(), 746, 34);
    ctx.textAlign = "left";

    if (image) {
      const frame = { x: 64, y: 72, w: 640, h: 400 };
      const imageRatio = image.width / image.height;
      const frameRatio = frame.w / frame.h;
      let sx = 0;
      let sy = 0;
      let sw = image.width;
      let sh = image.height;
      if (imageRatio > frameRatio) {
        sw = image.height * frameRatio;
        sx = (image.width - sw) / 2;
      } else {
        sh = image.width / frameRatio;
        sy = (image.height - sh) / 2;
      }
      ctx.drawImage(image, sx, sy, sw, sh, frame.x, frame.y, frame.w, frame.h);
    }

    ctx.fillStyle = "#d8d8d3";
    ctx.font = "500 17px 'Courier New', monospace";
    ctx.fillText(project.year, 22, 558);

    let x = 106;
    project.tags.forEach((tag) => {
      ctx.font = "500 15px 'Courier New', monospace";
      const width = ctx.measureText(tag).width + 30;
      roundedRect(ctx, x, 532, width, 34, 17);
      ctx.fillStyle = "#161616";
      ctx.fill();
      ctx.fillStyle = "#bdbdb8";
      ctx.fillText(tag, x + 15, 554);
      x += width + 9;
    });
    texture.needsUpdate = true;
  };

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  draw();

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => draw(image);
  image.src = project.image;

  return texture;
}

function SphericalGallery({ onSelect, onInteraction }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.018);

    const camera = new THREE.PerspectiveCamera(68, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("data-testid", "spherical-gallery");
    renderer.domElement.setAttribute("aria-label", "Interactive spherical project gallery");
    host.appendChild(renderer.domElement);

    const gallery = new THREE.Group();
    scene.add(gallery);

    const geometry = new THREE.PlaneGeometry(2.45, 1.9, 1, 1);
    const cards = [];
    const textures = projects.map((project) => makeCardTexture(project, renderer));
    const materials = textures.map((texture) => new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      transparent: true,
    }));
    const columns = 18;
    const rows = 5;
    const radius = 7.2;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const projectIndex = (column + row * 3) % projects.length;
        const project = projects[projectIndex];
        const theta = (column / columns) * Math.PI * 2;
        const phi = (row - (rows - 1) / 2) * 0.275;
        const cosPhi = Math.cos(phi);
        const mesh = new THREE.Mesh(geometry, materials[projectIndex]);
        mesh.position.set(
          radius * Math.sin(theta) * cosPhi,
          radius * Math.sin(phi),
          -radius * Math.cos(theta) * cosPhi,
        );
        mesh.lookAt(0, 0, 0);
        mesh.userData.projectIndex = projectIndex;
        mesh.userData.baseScale = 1;
        gallery.add(mesh);
        cards.push(mesh);
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let currentYaw = 0.06;
    let currentPitch = -0.03;
    let targetYaw = currentYaw;
    let targetPitch = currentPitch;
    let velocityX = 0;
    let velocityY = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let hovered = null;

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const updateHover = (event) => {
      if (dragging) return;
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const next = raycaster.intersectObjects(cards, false)[0]?.object ?? null;
      if (next === hovered) return;
      if (hovered) gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "power3.out" });
      hovered = next;
      if (hovered) gsap.to(hovered.scale, { x: 1.055, y: 1.055, z: 1.055, duration: 0.35, ease: "power3.out" });
      renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
    };

    const onPointerDown = (event) => {
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      renderer.domElement.setPointerCapture(pointerId);
      renderer.domElement.style.cursor = "grabbing";
      onInteraction();
    };

    const onPointerMove = (event) => {
      if (!dragging) {
        updateHover(event);
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 7) moved = true;
      targetYaw += dx * 0.0035;
      targetPitch += dy * 0.003;
      targetPitch = THREE.MathUtils.clamp(targetPitch, -0.62, 0.62);
      velocityX = dx * 0.00075;
      velocityY = dy * 0.00055;
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerUp = (event) => {
      if (pointerId !== null && renderer.domElement.hasPointerCapture(pointerId)) {
        renderer.domElement.releasePointerCapture(pointerId);
      }
      dragging = false;
      renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
      if (!moved) {
        setPointer(event);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(cards, false)[0];
        if (hit) onSelect(hit.object.userData.projectIndex);
      }
      pointerId = null;
    };

    const onWheel = (event) => {
      event.preventDefault();
      targetYaw -= event.deltaX * 0.00065;
      targetPitch -= event.deltaY * 0.00055;
      targetPitch = THREE.MathUtils.clamp(targetPitch, -0.62, 0.62);
      velocityX = -event.deltaX * 0.00002;
      velocityY = -event.deltaY * 0.000018;
      onInteraction();
    };

    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") targetYaw -= 0.22;
      if (event.key === "ArrowRight") targetYaw += 0.22;
      if (event.key === "ArrowUp") targetPitch -= 0.18;
      if (event.key === "ArrowDown") targetPitch += 0.18;
      targetPitch = THREE.MathUtils.clamp(targetPitch, -0.62, 0.62);
    };

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", resize);

    let frame = 0;
    const tick = () => {
      if (!dragging) {
        targetYaw += velocityX;
        targetPitch = THREE.MathUtils.clamp(targetPitch + velocityY, -0.62, 0.62);
        velocityX *= 0.94;
        velocityY *= 0.9;
      }
      currentYaw += (targetYaw - currentYaw) * 0.075;
      currentPitch += (targetPitch - currentPitch) * 0.075;
      gallery.rotation.y = currentYaw;
      gallery.rotation.x = currentPitch;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      geometry.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [onInteraction, onSelect]);

  return <div className="gallery-stage" ref={hostRef} />;
}

function ProjectPage({ project, onClose }) {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(pageRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.95, ease: "expo.inOut" });
      gsap.fromTo(".project-page__image", { scale: 1.12 }, { scale: 1, duration: 1.3, delay: 0.2, ease: "power3.out" });
      gsap.fromTo(".project-page__reveal", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, delay: 0.45, duration: 0.7, ease: "power3.out" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const close = () => {
    gsap.to(pageRef.current, { yPercent: 100, duration: 0.75, ease: "expo.inOut", onComplete: onClose });
  };

  return (
    <article className="project-page" ref={pageRef} data-testid="project-page">
      <header className="project-page__header">
        <button type="button" className="icon-button icon-button--light" onClick={close} aria-label="Back to gallery">
          <ArrowLeft size={22} />
        </button>
        <p>{project.client} / {project.year}</p>
        <button type="button" className="icon-button icon-button--light" onClick={close} aria-label="Close project">
          <X size={21} />
        </button>
      </header>
      <div className="project-page__hero">
        <img className="project-page__image" src={project.image} alt="" />
      </div>
      <div className="project-page__body">
        <div>
          <p className="project-page__eyebrow project-page__reveal">Selected project</p>
          <h1 className="project-page__reveal">{project.title}</h1>
        </div>
        <div className="project-page__copy project-page__reveal">
          <p>
            An experimental digital commission built around motion, material and a strong point of view.
            This template is intentionally concise so the spatial gallery remains the main event.
          </p>
          <button type="button" className="project-page__link">
            View case study <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [view, setView] = useState("grid");

  const openProject = useCallback((index) => setSelectedProject(projects[index]), []);
  const hideHint = useCallback(() => setHintVisible(false), []);

  return (
    <main className="app-shell">
      <SphericalGallery onSelect={openProject} onInteraction={hideHint} />

      <header className="topbar">
        <a className="brand-mark" href="#" aria-label="Orbit studio home">
          <Ghost size={45} weight="regular" />
        </a>
        <button type="button" className="sound-control">
          <SpeakerSimpleSlash size={15} />
          <span>SOUND [OFF]</span>
        </button>
        <p className="manifesto">ORBIT IS A TECHNOLOGY-LED<br />CREATIVE STUDIO CRAFTING<br />EXPERIENCES FOR GLOBAL BRANDS.</p>
        <p className="studio-time">● SOFIA, BG&nbsp;&nbsp; 18:42 GMT+3<br /><span>○ LONDON, UK&nbsp; 16:42 GMT+1</span></p>
        <button type="button" className="talk-button">Let&apos;s Talk</button>
      </header>

      <div className={`drag-hint ${hintVisible ? "" : "drag-hint--hidden"}`}>
        <span>CLICK + DRAG</span>
        <i />
        <span>SCROLL TO ORBIT</span>
      </div>

      <div className="bottom-controls">
        <div className="view-switcher" aria-label="Gallery view">
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            onClick={() => setView("grid")}
            aria-label="Spherical grid view"
          >
            <CirclesFour size={20} />
          </button>
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <button type="button" className="is-active">Work</button>
          <button type="button">About</button>
          <button type="button">Careers</button>
        </nav>
        <button type="button" className="filter-button">Filter</button>
      </div>

      <p className="counter">12 PROJECTS / DRAG ANY DIRECTION</p>

      {selectedProject && <ProjectPage project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </main>
  );
}
