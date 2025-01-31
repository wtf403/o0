document.addEventListener("DOMContentLoaded", () => {
  const tabsBg = document.getElementById("tabs-bg");
  tabsBg.addEventListener("load", () => {
    const svgDoc = tabsBg.contentDocument;

    svgDoc.querySelectorAll(".tab-bg").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const row = e.target.closest('rect[class^="row-"]');
        if (!row) return;

        const rowIndex = parseInt(row.getAttribute("class").split("-")[1]);
        const isRightToLeft = rowIndex % 2 !== 0;

        const currentTab = e.target;
        currentTab.style.opacity = 0;

        setTimeout(() => {
          const pattern = svgDoc.getElementById(
            `tab-row-${isRightToLeft ? "rtl" : "ltr"}`
          );
          if (isRightToLeft) {
            pattern.appendChild(currentTab.parentNode);
          } else {
            pattern.insertBefore(currentTab.parentNode, pattern.firstChild);
          }
          currentTab.style.opacity = 1;
        }, 200);
      });
    });
  });
});
