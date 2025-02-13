const totalImages = 9;
const lightboxesContainer = document.getElementById("lightboxes");

for (let i = 1; i <= totalImages; i++) {
  const prev = i === 1 ? totalImages : i - 1;
  const next = i === totalImages ? 1 : i + 1;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox-container";
  lightbox.innerHTML = `
    <a href="#" class="lightbox" id="${i}">
      <section class="carousel">
        <ol class="viewport">
          <li tabindex="0" class="slide">
            <div class="snapper">
              <img class="img" src="assets/screenshots/${i}.png" alt="Screenshot ${i}" />
            </div>
          </li>
        </ol>
      </section>
    </a>
    <nav class="navigation">
      <a href="#${prev}" class="prev" aria-label="Previous slide">←</a>
      <span class="counter" aria-label="Current slide">${i} / ${totalImages}</span>
      <a href="#${next}" class="next" aria-label="Next slide">→</a>
    </nav>
  `;

  lightboxesContainer.appendChild(lightbox);
}

document.addEventListener("keydown", (e) => {
  const currentHash = window.location.hash || "#1";
  const currentNum = parseInt(currentHash.slice(1));

  let nextNum;
  if (e.key === "ArrowRight" || e.key === "l") {
    nextNum = currentNum === totalImages ? 1 : currentNum + 1;
  } else if (e.key === "ArrowLeft" || e.key === "h") {
    nextNum = currentNum === 1 ? totalImages : currentNum - 1;
  } else if (e.key === "Escape") {
    window.location.hash = "";
    return;
  } else {
    return;
  }

  window.location.hash = nextNum;
});

document.querySelectorAll(".img").forEach((img) => {
  img.addEventListener("click", (e) => {
    e.preventDefault();
  });
});
