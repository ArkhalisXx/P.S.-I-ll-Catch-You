(() => {
  const find = (id) => document.getElementById(id);
  const world = find("world");
  const dialog = find("dialog");
  const dialogTitle = find("dialog-title");
  const dialogBody = find("dialog-body");
  const dialogActions = find("dialog-actions");
  const soundButton = find("sound");
  const names = PaperGame.levelNames;
  const levelCount = names.length;
  const saveKey = "paperheart-anniversary-v1";

  function readSave() {
    try {
      const data = JSON.parse(localStorage.getItem(saveKey));
      const chapters = Array.isArray(data?.completed) ? data.completed : [];
      return {
        completed: new Set(chapters.filter((chapter) => Number.isInteger(chapter) && chapter >= 0 && chapter < levelCount)),
        sound: data?.sound === true
      };
    } catch {
      return { completed: new Set(), sound: false };
    }
  }

  const progress = readSave();
  let audio;
  let current = 0;
  let result = null;
  let lastFocus;
  const pressed = new Map();

  function save() {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ completed: [...progress.completed], sound: progress.sound }));
    } catch {
      // Progress remains available until the page closes.
    }
  }

  const melodies = {
    jump: [[440, 0, .075], [659, .035, .09]],
    heart: [[622, 0, .14], [831, .065, .18]],
    fold: [[349, 0, .1], [440, .045, .11], [523, .09, .14]],
    spring: [[392, 0, .09], [587, .045, .15]],
    fall: [[392, 0, .09], [294, .045, .14]],
    complete: [[523, 0, .24], [659, .12, .26], [784, .25, .3], [1047, .40, .4]]
  };

  function wakeSound() {
    if (!progress.sound) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    try {
      if (Audio && !audio) audio = new Audio();
      if (audio?.state === "suspended") audio.resume().catch(() => {});
    } catch {
      // Play also works when audio is unavailable.
    }
  }

  function playSound(type) {
    if (!progress.sound || audio?.state !== "running") return;
    const start = audio.currentTime;
    for (const [frequency, delay, span] of melodies[type] || []) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const at = start + delay;
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, at);
      gain.gain.exponentialRampToValueAtTime(.07, at + .018);
      gain.gain.exponentialRampToValueAtTime(.001, at + span);
      osc.connect(gain).connect(audio.destination);
      osc.start(at);
      osc.stop(at + span + .02);
    }
  }

  function drawIcon(node, type) {
    const icon = document.createElement("canvas");
    icon.width = icon.height = 20;
    icon.setAttribute("aria-hidden", "true");
    const ctx = icon.getContext("2d");
    ctx.strokeStyle = ctx.fillStyle = "#875360";
    ctx.lineWidth = 1.65;
    ctx.lineCap = ctx.lineJoin = "round";
    const line = (points) => {
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      for (const point of points.slice(1)) ctx.lineTo(...point);
      ctx.stroke();
    };
    const arc = (x, y, r, from = 0, to = Math.PI * 2) => {
      ctx.beginPath();
      ctx.arc(x, y, r, from, to);
      ctx.stroke();
    };
    switch (type) {
      case "sound":
      case "mute":
        line([[3, 8], [6, 8], [10, 5], [10, 15], [6, 12], [3, 12], [3, 8]]);
        if (type === "sound") {
          arc(10, 10, 4, -.85, .85);
          arc(10, 10, 7, -.82, .82);
        } else {
          line([[13, 8], [17, 12]]);
          line([[17, 8], [13, 12]]);
        }
        break;
      case "help":
        arc(10, 10, 7);
        ctx.font = "bold 11px Georgia";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", 10, 10);
        break;
      case "restart":
        arc(10, 10, 6, -.8, 4.61);
        line([[5, 4], [10, 4], [8, 7]]);
        break;
      case "pause":
        line([[7, 5], [7, 15]]);
        line([[13, 5], [13, 15]]);
        break;
      case "book":
        line([[10, 6], [7, 4], [3, 4], [3, 14], [7, 14], [10, 16], [13, 14], [17, 14], [17, 4], [13, 4], [10, 6], [10, 16]]);
        break;
      case "close":
        line([[5, 5], [15, 15]]);
        line([[15, 5], [5, 15]]);
        break;
    }
    node.replaceChildren(icon);
  }

  function renderSound() {
    soundButton.setAttribute("aria-pressed", String(progress.sound));
    soundButton.setAttribute("aria-label", progress.sound ? "Sound on" : "Sound off");
    soundButton.querySelector("span").textContent = progress.sound ? "Sound on" : "Sound off";
    drawIcon(soundButton.querySelector("i"), progress.sound ? "sound" : "mute");
  }

  for (const canvas of document.querySelectorAll("[data-art]")) drawPostage(canvas, canvas.dataset.art);
  for (const icon of document.querySelectorAll("[data-icon]")) drawIcon(icon, icon.dataset.icon);
  renderSound();

  function showGameState(state) {
    find("chapter-number").textContent = "CH. " + String(state.level + 1).padStart(2, "0");
    find("chapter-title").textContent = state.name;
    find("player").textContent = state.character;
    find("player").parentElement.dataset.side = state.character;
    find("hearts").textContent = state.hearts + " / 3";
    if (find("hint").textContent !== state.hint) find("hint").textContent = state.hint;
  }

  function setInput(source, action) {
    if (pressed.has(source)) return;
    const alreadyHeld = [...pressed.values()].includes(action);
    pressed.set(source, action);
    if (!alreadyHeld) game.action(action, true);
  }

  function clearInput(source) {
    const action = pressed.get(source);
    if (!action) return;
    pressed.delete(source);
    if (![...pressed.values()].includes(action)) game.action(action, false);
  }

  function releaseControls() {
    for (const source of pressed.keys()) clearInput(source);
    for (const button of document.querySelectorAll(".held")) button.classList.remove("held");
  }

  function showDialog(title, body, actions) {
    if (!dialog.open) lastFocus = document.activeElement;
    releaseControls();
    game.setPaused(true);
    dialogTitle.textContent = title;
    dialogBody.replaceChildren(body);
    dialogActions.replaceChildren();
    actions.forEach(([label, run], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      if (index === 0) button.className = "primary";
      button.addEventListener("click", run);
      dialogActions.append(button);
    });
    if (!dialog.open) dialog.showModal();
    dialogActions.firstElementChild.focus();
  }

  function paragraphs(...lines) {
    const content = document.createDocumentFragment();
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      content.append(p);
    }
    return content;
  }

  function chapterComplete(level) {
    progress.completed.add(level);
    save();
    renderChapters();
    result = level;
    showResult();
  }

  function showResult() {
    if (result === levelCount - 1) {
      showDialog("On the same page", find("ending-note").content.cloneNode(true), [
        ["Play again", () => openChapter(0)],
        ["Close the card", () => dialog.close()]
      ]);
      return;
    }
    showDialog("Letter delivered!", paragraphs(names[result] + " is tucked into your card."), [
      ["Next chapter", () => openChapter(result + 1)],
      ["Replay chapter", () => openChapter(result)]
    ]);
  }

  function renderChapters() {
    const list = find("chapter-list");
    list.replaceChildren();
    for (const [index, title] of names.entries()) {
      const button = document.createElement("button");
      const done = progress.completed.has(index);
      button.className = done ? "chapter done" : "chapter";
      button.type = "button";
      button.textContent = String(index + 1).padStart(2, "0");
      button.disabled = !done && index > 0 && !progress.completed.has(index - 1);
      button.title = "Chapter " + (index + 1) + " · " + title + (done ? " · Complete" : button.disabled ? " · Locked" : "");
      button.setAttribute("aria-label", button.title);
      if (index === current) button.setAttribute("aria-current", "step");
      button.addEventListener("click", () => openChapter(index));
      list.append(button);
    }
    find("progress").textContent = progress.completed.size + " of " + levelCount + " complete";
  }

  function openChapter(index, focus = true) {
    if (dialog.open) dialog.close();
    releaseControls();
    current = index;
    result = null;
    game.load(index);
    game.setPaused(false);
    renderChapters();
    if (focus) world.focus({ preventScroll: true });
  }

  function pause() {
    if (dialog.open) {
      dialog.close();
      return;
    }
    if (result !== null) {
      showResult();
      return;
    }
    showDialog("Taking a little break", paragraphs("Axel and Swayze will be right here."), [
      ["Keep playing", () => dialog.close()],
      ["Restart chapter", () => openChapter(current)]
    ]);
  }

  const game = new PaperGame(world, { onUpdate: showGameState, onComplete: chapterComplete, onSound: playSound });
  const unlocked = names.findIndex((_, index) => !progress.completed.has(index));
  openChapter(unlocked < 0 ? 0 : unlocked, false);

  find("pause").addEventListener("click", pause);
  find("restart").addEventListener("click", () => openChapter(current));
  find("dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    game.setPaused(false);
    if (dialog.contains(document.activeElement) || document.activeElement === document.body) {
      const target = lastFocus && document.contains(lastFocus) ? lastFocus : world;
      target.focus({ preventScroll: true });
    }
  });

  find("help").addEventListener("click", () => {
    showDialog("How to play", paragraphs(
      "Move with the arrow keys or A and D. Press Space to jump.",
      "Press X to fold the card and switch between Axel and Swayze. Hearts collected on one side can open a path on the other.",
      "Collect all three hearts, then guide the active character to the envelope. Use the on-screen controls on a touch screen."
    ), [["Back to the card", () => dialog.close()]]);
  });

  soundButton.addEventListener("click", () => {
    progress.sound = !progress.sound;
    wakeSound();
    save();
    renderSound();
    if (audio?.state === "running") playSound("heart");
  });

  const bindings = {
    ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
    Space: "jump", ArrowUp: "jump", KeyW: "jump", KeyX: "fold"
  };
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === "KeyP" || (event.code === "Escape" && !dialog.open)) {
      event.preventDefault();
      if (!event.repeat) pause();
      return;
    }
    const action = bindings[event.code];
    if (!action || dialog.open || (event.target.closest("button") && event.code === "Space")) return;
    event.preventDefault();
    if (!event.repeat) {
      wakeSound();
      setInput(event.code, action);
    }
  });
  document.addEventListener("keyup", (event) => clearInput(event.code));
  window.addEventListener("blur", releaseControls);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseControls();
  });

  for (const button of document.querySelectorAll("[data-action]")) {
    const action = button.dataset.action;
    const source = (event) => "pointer-" + event.pointerId;
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      wakeSound();
      setInput(source(event), action);
      button.classList.add("held");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, (event) => {
        clearInput(source(event));
        if (![...pressed.values()].includes(action)) button.classList.remove("held");
      });
    }
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      wakeSound();
      setInput("touch-button", action);
      clearInput("touch-button");
    });
  }
})();
