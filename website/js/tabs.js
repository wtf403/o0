const websites = [
  { title: "OpenAI", favicon: "https://www.openai.com/favicon.ico" },
  { title: "GitHub", favicon: "https://github.com/favicon.ico" },
  { title: "Stack Overflow", favicon: "https://stackoverflow.com/favicon.ico" },
  { title: "Google", favicon: "https://www.google.com/favicon.ico" },
  { title: "Twitter", favicon: "https://twitter.com/favicon.ico" },
  { title: "Facebook", favicon: "https://www.facebook.com/favicon.ico" },
  { title: "LinkedIn", favicon: "https://www.linkedin.com/favicon.ico" },
  { title: "Reddit", favicon: "https://www.reddit.com/favicon.ico" },
  { title: "YouTube", favicon: "https://www.youtube.com/favicon.ico" },
  {
    title: "Hacker News",
    favicon: "https://news.ycombinator.com/favicon.ico",
  },
  { title: "GitLab", favicon: "https://gitlab.com/favicon.ico" },
  { title: "Bitbucket", favicon: "https://bitbucket.org/favicon.ico" },
  { title: "Slack", favicon: "https://slack.com/favicon.ico" },
];

const TAB_WIDTH = 175;
const TAB_GAP = 6;
const ROW_HEIGHT = 28;

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function tabTemplate(website, rowIndex, tabIndex, isChecked) {
  return `
    <label class="tab">
      <input class="radio" name="row-${rowIndex}" type="radio" ${
    isChecked ? "checked" : ""
  } />
      <img class="favicon" src="${website.favicon}" alt="${
    website.title
  }" width="16" height="16" />
      <span class="title">${website.title}</span>
      <div class="cross-container">
        <svg class="cross" width="8" height="8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 8">
          <path stroke="currentColor" stroke-width="1.5" d="m7.6 7.4-7-7M.5 7.5l7-7"/>
        </svg>
      </div>
      <svg class="bottom" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 198 12">
        <path fill="currentColor" fill-rule="evenodd" d="M0 0h12H0Zm0 12Zm0 0A12 12 0 0 0 12 0v12H0ZM12 0Zm186 0h-12 12Zm0 12Zm0 0a12 12 0 0 1-12-12v12h12ZM186 0Z" clip-rule="evenodd"/>
        <path fill="currentColor" d="M12 12V0h174v12H12Z"/>
      </svg>
    </label>
  `;
}

function buildTabsUI() {
  const tabsBg = document.querySelector(".tabs-bg");
  if (!tabsBg) return;

  tabsBg.innerHTML = "";
  tabsBg.style.top = "0";
  tabsBg.style.left = "0";
  tabsBg.style.width = "100%";
  tabsBg.style.pointerEvents = "auto";

  const numRows = Math.max(1, Math.floor(window.innerHeight / ROW_HEIGHT));
  const numCols = Math.ceil((window.innerWidth * 2) / (TAB_WIDTH + TAB_GAP));

  for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
    const marquee = document.createElement("marquee");
    marquee.setAttribute("behavior", "alternate");
    const directions = ["left", "right"];
    marquee.setAttribute(
      "direction",
      directions[Math.floor(Math.random() * directions.length)]
    );
    const scrollAmount = Math.floor(Math.random() * 3) + 1;
    marquee.setAttribute("scrollamount", scrollAmount);
    marquee.style.display = "block";
    marquee.style.overflow = "hidden";

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs";

    let websitesForRow = [];
    while (websitesForRow.length < numCols) {
      websitesForRow = websitesForRow.concat(shuffleArray(websites));
    }
    websitesForRow = websitesForRow.slice(0, numCols);

    const checkedIndex = Math.floor(Math.random() * numCols);

    let tabsHtml = "";
    websitesForRow.forEach((website, tabIndex) => {
      const isChecked = tabIndex === checkedIndex;
      tabsHtml += tabTemplate(website, rowIndex, tabIndex, isChecked);
    });
    tabsContainer.innerHTML = tabsHtml;
    marquee.appendChild(tabsContainer);
    tabsBg.appendChild(marquee);
  }
}

function handleCloseTab(e) {
  const crossEl = e.target.closest(".cross-container");
  if (!crossEl) return;
  e.stopPropagation();

  const tabEl = crossEl.closest(".tab");
  if (!tabEl) return;
  const tabsContainer = tabEl.parentElement;
  if (!tabsContainer) return;

  tabEl.classList.add("closing");

  tabEl.addEventListener("animationend", function handler() {
    tabEl.removeEventListener("animationend", handler);
    tabEl.classList.remove("closing");
    const children = Array.from(tabsContainer.children);
    const index = children.indexOf(tabEl);
    const count = children.length;
    if (index < count / 2) {
      tabsContainer.appendChild(tabEl);
    } else {
      tabsContainer.insertBefore(tabEl, tabsContainer.firstChild);
    }
  });
}

function attachCloseTabListener() {
  const tabsBg = document.querySelector(".tabs-bg");
  if (!tabsBg) return;
  tabsBg.addEventListener("click", (e) => {
    if (e.target.closest(".cross-container")) {
      handleCloseTab(e);
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

function initTabs() {
  buildTabsUI();
  attachCloseTabListener();
}

document.addEventListener("DOMContentLoaded", initTabs);
window.addEventListener(
  "resize",
  debounce(() => {
    buildTabsUI();
  }, 150)
);
