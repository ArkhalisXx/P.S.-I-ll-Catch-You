(() => {
  const find = (id) => document.getElementById(id);
  const world = find("world");
  const objective = find("chapter-objective");
  const dialog = find("dialog");
  const dialogTitle = find("dialog-title");
  const dialogBody = find("dialog-body");
  const dialogActions = find("dialog-actions");
  const soundButton = find("sound");
  const menuStart = find("menu-start");
  const names = PaperGame.levelNames;
  const locations = Scenery.locations;
  const levelCount = names.length;
  const saveKey = "paperheart-anniversary-v1";

  function readSave() {
    try {
      const data = JSON.parse(localStorage.getItem(saveKey));
      const chapters = Array.isArray(data?.completed) ? data.completed : [];
      return {
        completed: new Set(chapters.filter((chapter) => Number.isInteger(chapter) && chapter >= 0 && chapter < levelCount)),
        sound: data?.sound !== false,
        lastChapter: Number.isInteger(data?.lastChapter) ? data.lastChapter : null
      };
    } catch {
      return { completed: new Set(), sound: true, lastChapter: null };
    }
  }

  const progress = readSave();
  let audio;
  let current = 0;
  let result = null;
  let screen = "menu";
  let lastFocus;
  const pressed = new Map();

  function save() {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ completed: [...progress.completed], sound: progress.sound, lastChapter: progress.lastChapter }));
    } catch {
      // Progress remains available until the page closes.
    }
  }

  const melodies = {
    jump: [[440, 0, .075], [659, .035, .09]],
    heart: [[622, 0, .14], [831, .065, .18]],
    fold: [[349, 0, .1], [440, .045, .11], [523, .09, .14]],
    spring: [[392, 0, .09], [587, .045, .15]],
    switch: [[330, 0, .08], [554, .045, .12]],
    pass: [[523, 0, .12], [659, .06, .14], [784, .12, .18]],
    crumble: [[247, 0, .07], [185, .045, .11]],
    fall: [[392, 0, .09], [294, .045, .14]],
    complete: [[523, 0, .24], [659, .12, .26], [784, .25, .3], [1047, .40, .4]]
  };

  function wakeSound() {
    if (!progress.sound || document.hidden) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    try {
      if (Audio && !audio) audio = new Audio();
      if (!audio) return;
      if (audio.state === "running") {
        PaperMusic.start(audio);
      } else {
        audio.resume().then(() => {
          if (progress.sound && !document.hidden) PaperMusic.start(audio);
        }).catch(() => {});
      }
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

  const couple = find("menu-couple").getContext("2d");
  couple.fillStyle = "#27253699";
  couple.fillRect(12, 43, 52, 2);
  Sprites.draw(couple, "Axel", 9, 12);
  Sprites.draw(couple, "Swayze", 37, 12, 1, -1);
  couple.fillStyle = "#f3a2b2";
  couple.fillRect(35, 3, 3, 3);
  couple.fillRect(40, 3, 3, 3);
  couple.fillRect(36, 5, 6, 2);
  couple.fillRect(37, 7, 4, 1);
  couple.fillRect(38, 8, 2, 1);

  function showGameState(state) {
    find("chapter-number").textContent = "CH. " + String(state.level + 1).padStart(2, "0");
    find("chapter-title").textContent = state.name;
    find("chapter-location").textContent = locations[state.level];
    find("player").textContent = state.character;
    find("player").parentElement.dataset.side = state.character;
    objective.textContent = state.progress;
    objective.parentElement.title = state.goalLabel;
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
    progress.lastChapter = level === levelCount - 1 ? null : level + 1;
    save();
    renderChapters();
    result = level;
    showResult();
  }

  function showResult() {
    if (result === levelCount - 1) {
      showDialog("On the same page", find("ending-note").content.cloneNode(true), [
        ["Play again", () => openChapter(0)],
        ["Main menu", () => enterMenu()]
      ]);
      return;
    }
    showDialog("Chapter complete", paragraphs(names[result] + " is tucked into your card."), [
      ["Next chapter", () => openChapter(result + 1)],
      ["Replay chapter", () => openChapter(result)]
    ]);
  }

  function isUnlocked(index) {
    return Number.isInteger(index) && index >= 0 && index < levelCount &&
      (index === 0 || progress.completed.has(index) || progress.completed.has(index - 1));
  }

  function savedChapter() {
    if (isUnlocked(progress.lastChapter)) return progress.lastChapter;
    const next = names.findIndex((_, index) => isUnlocked(index) && !progress.completed.has(index));
    return next === -1 ? 0 : next;
  }

  const thumbnails = [];
  function chapterThumbnail(index) {
    if (thumbnails[index]) return thumbnails[index];
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 102;
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    ctx.scale(3 / 8, 3 / 8);
    ctx.imageSmoothingEnabled = false;
    Scenery.background(ctx, index, 2, 0);
    thumbnails[index] = canvas;
    return canvas;
  }

  function renderChapters() {
    const list = find("chapter-list");
    list.replaceChildren();
    const expanded = screen === "chapters";
    const selected = screen === "play" ? current : game.level >= 0 && result === null ? current : savedChapter();
    for (const [index, title] of names.entries()) {
      const button = document.createElement("button");
      const done = progress.completed.has(index);
      const number = String(index + 1).padStart(2, "0");
      button.className = done ? "chapter done" : "chapter";
      button.type = "button";
      button.disabled = !isUnlocked(index);
      const status = done ? "Complete" : button.disabled ? "Locked" : "Open";
      if (expanded) {
        const label = document.createElement("small");
        label.textContent = "CH. " + number + " · " + status;
        const name = document.createElement("strong");
        name.textContent = locations[index];
        button.append(chapterThumbnail(index), label, name);
      } else {
        button.textContent = number;
      }
      button.title = "Chapter " + number + " · " + title + " · " + locations[index] + " · " + status;
      button.setAttribute("aria-label", button.title);
      if (index === selected) button.setAttribute("aria-current", "step");
      button.addEventListener("click", () => {
        wakeSound();
        if (expanded && game.level === index && result === null) resumeChapter();
        else openChapter(index);
      });
      list.append(button);
    }
    find("progress").textContent = progress.completed.size + " of " + levelCount + " complete";
  }

  function switchScreen(next) {
    screen = next;
    document.body.dataset.screen = next;
    find("title-screen").hidden = next !== "menu";
    find("play-screen").hidden = next !== "play";
    find("chapters").hidden = next === "menu";
    find("chapters-back").hidden = next !== "chapters";
  }

  function enterMenu(focus = true) {
    switchScreen("menu");
    releaseControls();
    game.setPaused(true);
    if (dialog.open) dialog.close();
    let label = "Start our walk";
    if (game.level >= 0 && result === null) label = "Resume our walk";
    else if (progress.completed.size === levelCount && progress.lastChapter === null) label = "Walk together again";
    else if (progress.completed.size || isUnlocked(progress.lastChapter)) label = "Continue chapter " + String(savedChapter() + 1).padStart(2, "0");
    find("start-label").textContent = label;
    if (focus) menuStart.focus();
  }

  function resumeChapter() {
    switchScreen("play");
    game.setPaused(false);
    renderChapters();
    world.focus();
  }

  function openChapter(index) {
    if (!isUnlocked(index)) return;
    switchScreen("play");
    if (dialog.open) dialog.close();
    releaseControls();
    current = index;
    result = null;
    progress.lastChapter = index;
    save();
    game.load(index);
    renderChapters();
    world.focus();
  }

  function pause() {
    if (screen !== "play") return;
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
      ["Main menu", () => enterMenu()],
      ["Restart chapter", () => openChapter(current)]
    ]);
  }

  const game = new PaperGame(world, { onUpdate: showGameState, onComplete: chapterComplete, onSound: playSound });
  enterMenu(false);

  menuStart.addEventListener("click", () => {
    wakeSound();
    if (game.level >= 0 && result === null) resumeChapter();
    else openChapter(savedChapter());
  });
  find("menu-chapters").addEventListener("click", () => {
    switchScreen("chapters");
    renderChapters();
    find("chapters-back").focus();
  });
  find("chapters-back").addEventListener("click", () => enterMenu());
  find("back-to-menu").addEventListener("click", () => enterMenu());

  find("pause").addEventListener("click", pause);
  find("restart").addEventListener("click", () => openChapter(current));
  find("dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    game.setPaused(screen !== "play");
    if (dialog.contains(document.activeElement) || document.activeElement === document.body) {
      const target = lastFocus && document.contains(lastFocus) && !lastFocus.closest("[hidden]") ? lastFocus :
        screen === "menu" ? menuStart : screen === "chapters" ? find("chapters-back") : world;
      target.focus({ preventScroll: true });
    }
  });

  find("help").addEventListener("click", () => {
    showDialog("How to play", paragraphs(
      "Move with the arrow keys or A and D. Press Space to jump.",
      "Press X to fold the card and switch between Axel and Swayze. Use the on-screen controls on a touch screen.",
      "Follow the note under the play area. Step onto switches, pass letters between pages, and time your jumps across moving or fragile paper. If you fall, you’ll return to safe ground."
    ), [["Got it", () => dialog.close()]]);
  });

  soundButton.addEventListener("click", () => {
    progress.sound = !progress.sound;
    if (progress.sound) wakeSound();
    else PaperMusic.stop();
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
    if (screen === "chapters" && event.code === "Escape" && !dialog.open) {
      event.preventDefault();
      enterMenu();
      return;
    }
    if (screen !== "play") return;
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
  document.addEventListener("pointerup", (event) => {
    if (!soundButton.contains(event.target)) wakeSound();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      releaseControls();
      PaperMusic.stop();
    } else if (audio) {
      wakeSound();
    }
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
