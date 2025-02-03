import Matter from "https://cdn.skypack.dev/matter-js";

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } =
  Matter;

document.addEventListener("DOMContentLoaded", () => {
  const engine = Engine.create({ enableSleeping: false });
  engine.world.gravity.y = 0;
  const bg = document.querySelector(".preview-bg");
  if (!bg) return;

  let images = [];
  let isDragging = false;
  let currentBody = null;
  let dragOffset = { x: 0, y: 0 };
  let clickStartTime = 0;
  const imageSize = Math.max(Math.min(window.innerWidth * 0.18, 280), 180);

  const render = Render.create({
    element: bg,
    engine: engine,
    options: {
      width: bg.clientWidth,
      height: bg.clientHeight,
      wireframes: false,
      background: "transparent",
      pixelRatio: window.devicePixelRatio,
    },
  });

  render.canvas.style.display = "none";

  let canvasRect = bg.getBoundingClientRect();

  setupWalls();
  setupImages();
  setTimeout(() => {
    setupLogoWalls();
  }, 1000);
  setupDragHandling();
  setupEngineEvents();

  window.addEventListener("resize", debounce(handleResize, 100));

  const runner = Runner.create();
  Runner.run(runner, engine);

  function setupWalls() {
    canvasRect = bg.getBoundingClientRect();
    const wallThickness = 20;
    const walls = [
      Bodies.rectangle(
        canvasRect.width / 2,
        0,
        canvasRect.width,
        wallThickness,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        canvasRect.width / 2,
        canvasRect.height,
        canvasRect.width,
        wallThickness,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        0,
        canvasRect.height / 2,
        wallThickness,
        canvasRect.height,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        canvasRect.width,
        canvasRect.height / 2,
        wallThickness,
        canvasRect.height,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
    ];
    Composite.add(engine.world, walls);
  }

  function setupImages() {
    canvasRect = bg.getBoundingClientRect();

    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;

    for (let i = 0; i < 9; i++) {
      const body = createPhysicsBody(centerX, centerY);
      const wrapper = createImageElement(i + 1, body.id);
      wrapper.style.transform = `translate3d(${centerX - imageSize / 2}px, ${
        centerY - imageSize / 2
      }px, 0)`;
      images.push({ body, element: wrapper });
      Composite.add(engine.world, body);
      bg.appendChild(wrapper);
    }

    function createPhysicsBody(centerX, centerY) {
      const angle = Math.random() * Math.PI * 2;
      const INITIAL_SPEED = 0.08;
      const vx = Math.cos(angle) * INITIAL_SPEED;
      const vy = Math.sin(angle) * INITIAL_SPEED;
      const body = Bodies.rectangle(centerX, centerY, imageSize, imageSize, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        density: 0.5,
        inertia: Infinity,
        render: { visible: false },
      });
      Body.setVelocity(body, { x: vx, y: vy });
      return body;
    }

    function createImageElement(i, id) {
      const wrapper = document.createElement("div");
      wrapper.className = "floating-image physics-image";
      wrapper.style.width = `${imageSize}px`;
      wrapper.style.height = `${imageSize}px`;
      wrapper.style.willChange = "transform";
      wrapper.dataset.bodyId = id;
      wrapper.innerHTML = `
        <img src="assets/screenshots/${i}.png"
             alt="Screenshot ${i}"
             draggable="false" />
      `;
      return wrapper;
    }
  }

  function setupLogoWalls() {
    const logo = document.querySelector(".logo-section");
    if (!logo) return;
    const containerRect = bg.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const offsetX = logoRect.left - containerRect.left;
    const offsetY = logoRect.top - containerRect.top;
    const wallThickness = 10;
    const logoWalls = [
      Bodies.rectangle(
        offsetX + logoRect.width / 2,
        offsetY,
        logoRect.width,
        wallThickness,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        offsetX + logoRect.width / 2,
        offsetY + logoRect.height,
        logoRect.width,
        wallThickness,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        offsetX,
        offsetY + logoRect.height / 2,
        wallThickness,
        logoRect.height,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
      Bodies.rectangle(
        offsetX + logoRect.width,
        offsetY + logoRect.height / 2,
        wallThickness,
        logoRect.height,
        {
          isStatic: true,
          restitution: 1,
          friction: 0,
          render: { visible: false },
        }
      ),
    ];
    Composite.add(engine.world, logoWalls);

    const centerX = offsetX + logoRect.width / 2;
    const centerY = offsetY + logoRect.height / 2;
    images.forEach(({ body, element }) => {
      if (
        body.position.x > offsetX &&
        body.position.x < offsetX + logoRect.width &&
        body.position.y > offsetY &&
        body.position.y < offsetY + logoRect.height
      ) {
        let dx = body.position.x - centerX;
        let dy = body.position.y - centerY;

        if (dx === 0 && dy === 0) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
        }
        const angle = Math.atan2(dy, dx);
        const THROW_SPEED = 5;
        Body.setVelocity(body, {
          x: Math.cos(angle) * THROW_SPEED,
          y: Math.sin(angle) * THROW_SPEED,
        });
      }
    });
  }

  function setupDragHandling() {
    document.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", handleDrag, { passive: false });
    document.addEventListener("touchend", endDrag, { passive: false });
  }

  function startDrag(e) {
    const evt = e.touches?.[0] || e;
    const target = evt.target.closest(".floating-image");
    if (!target) return;
    clickStartTime = Date.now();
    isDragging = true;
    currentBody = images.find(
      (img) => img.body.id === parseInt(target.dataset.bodyId)
    )?.body;
    if (currentBody) {
      target.classList.add("dragging");
      document.body.classList.add("dragging");
      Body.setVelocity(currentBody, { x: 0, y: 0 });
      const scale = render.options.pixelRatio;
      const mouseX = (evt.clientX - canvasRect.left) * scale;
      const mouseY = (evt.clientY - canvasRect.top) * scale;
      dragOffset.x = mouseX - currentBody.position.x;
      dragOffset.y = mouseY - currentBody.position.y;
    }
  }

  function handleDrag(e) {
    if (!isDragging || !currentBody) return;
    e.preventDefault();
    const evt = e.touches?.[0] || e;
    const scale = render.options.pixelRatio;
    const mouseX = (evt.clientX - canvasRect.left) * scale;
    const mouseY = (evt.clientY - canvasRect.top) * scale;

    const targetX = Math.max(
      imageSize / 2,
      Math.min(canvasRect.width - imageSize / 2, mouseX - dragOffset.x)
    );
    const targetY = Math.max(
      imageSize / 2,
      Math.min(canvasRect.height - imageSize / 2, mouseY - dragOffset.y)
    );

    const newX =
      currentBody.position.x + (targetX - currentBody.position.x) * 0.1;
    const newY =
      currentBody.position.y + (targetY - currentBody.position.y) * 0.1;

    Body.setPosition(currentBody, { x: newX, y: newY });
  }

  function endDrag(e) {
    if (e.type === "mouseup") {
      document.querySelectorAll(".floating-image.dragging").forEach((el) => {
        el.classList.remove("dragging");
      });
      document.body.classList.remove("dragging");
    }

    if (!currentBody) return;

    isDragging = false;
    const isClick = Date.now() - clickStartTime < 200;
    const target = e.target.closest(".floating-image");
    if (isClick && target) {
      window.location.hash = target
        .querySelector("img")
        .src.split("/")
        .pop()
        .split(".")[0];
    }
    const angle = Math.random() * Math.PI * 2;
    const CONSTANT_SPEED = 0.5;
    Body.setVelocity(currentBody, {
      x: Math.cos(angle) * CONSTANT_SPEED,
      y: Math.sin(angle) * CONSTANT_SPEED,
    });
    currentBody = null;
  }

  function setupEngineEvents() {
    const BASE_SPEED = 0.3;
    const SPEED_VARIATION = 0.2;
    const DIRECTION_CHANGE_PROB = 0.02;
    const REPULSION_STRENGTH = 0.015;
    const REPULSION_DISTANCE = 250;
    const REPULSION_DISTANCE_SQ = REPULSION_DISTANCE * REPULSION_DISTANCE;

    Events.on(engine, "afterUpdate", () => {
      images.forEach(({ body, element }) => {
        if (!isDragging || body !== currentBody) {
          if (Math.random() < DIRECTION_CHANGE_PROB) {
            const angle = Math.random() * Math.PI * 2;
            const speed = BASE_SPEED + (Math.random() - 0.5) * SPEED_VARIATION;
            Body.setVelocity(body, {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed,
            });
          }

          const speed = Vector.magnitude(body.velocity);
          if (speed < BASE_SPEED * 0.8) {
            const angle = Math.atan2(body.velocity.y, body.velocity.x);
            Body.setVelocity(body, {
              x: Math.cos(angle) * BASE_SPEED,
              y: Math.sin(angle) * BASE_SPEED,
            });
          }

          const MAX_SPEED = 3;
          if (speed > MAX_SPEED) {
            const factor = MAX_SPEED / speed;
            Body.setVelocity(body, {
              x: body.velocity.x * factor,
              y: body.velocity.y * factor,
            });
          }
        }

        element.style.transform = `translate3d(${
          body.position.x - imageSize / 2
        }px, ${body.position.y - imageSize / 2}px, 0)`;
      });

      for (let i = 0; i < images.length; i++) {
        for (let j = i + 1; j < images.length; j++) {
          const bodyA = images[i].body;
          const bodyB = images[j].body;
          if ((bodyA === currentBody || bodyB === currentBody) && isDragging)
            continue;

          const dx = bodyB.position.x - bodyA.position.x;
          const dy = bodyB.position.y - bodyA.position.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < REPULSION_DISTANCE_SQ && distanceSq > 0) {
            const distance = Math.sqrt(distanceSq);
            const forceMagnitude = REPULSION_STRENGTH / (distanceSq * distance);
            const force = { x: dx * forceMagnitude, y: dy * forceMagnitude };
            Body.applyForce(bodyA, bodyA.position, {
              x: -force.x,
              y: -force.y,
            });
            Body.applyForce(bodyB, bodyB.position, { x: force.x, y: force.y });
          }
        }
      }
    });
  }

  function handleResize() {
    canvasRect = bg.getBoundingClientRect();

    render.canvas.width = canvasRect.width;
    render.canvas.height = canvasRect.height;

    Composite.allBodies(engine.world).forEach((body) => {
      if (body.isStatic) {
        Composite.remove(engine.world, body);
      }
    });
    setupWalls();
    images.forEach(({ body, element }) => {
      const x = Math.max(
        imageSize / 2,
        Math.min(canvasRect.width - imageSize / 2, body.position.x)
      );
      const y = Math.max(
        imageSize / 2,
        Math.min(canvasRect.height - imageSize / 2, body.position.y)
      );
      Body.setPosition(body, { x, y });
      element.style.width = `${imageSize}px`;
      element.style.height = `${imageSize}px`;
    });
  }

  function debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }
});
