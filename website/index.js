import JSConfetti from "js-confetti";

const confetti = new JSConfetti();

confetti.addConfetti();

const canvas = document.getElementById("your_custom_canvas_id");

const jsConfetti = new JSConfetti({ canvas });
