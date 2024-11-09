function Runner(container, config) {
  if (Runner.instance_) return Runner.instance_;
  (Runner.instance_ = this),
    (this.outerContainerEl = document.querySelector(container)),
    (this.containerEl = null),
    (this.snackbarEl = null),
    (this.touchController = null),
    (this.config = config || Object.assign(Runner.config, Runner.normalConfig)),
    (this.dimensions = Runner.defaultDimensions),
    (this.gameType = null),
    (Runner.spriteDefinition = Runner.spriteDefinitionByType.original),
    (this.altGameImageSprite = null),
    (this.altGameModeActive = !1),
    (this.altGameModeFlashTimer = null),
    (this.fadeInTimer = 0),
    (this.canvas = null),
    (this.canvasCtx = null),
    (this.tRex = null),
    (this.distanceMeter = null),
    (this.distanceRan = 0),
    (this.highestScore = 0),
    (this.syncHighestScore = !1),
    (this.time = 0),
    (this.runningTime = 0),
    (this.msPerFrame = 1e3 / FPS),
    (this.currentSpeed = this.config.SPEED),
    (Runner.slowDown = !1),
    (this.obstacles = []),
    (this.activated = !1),
    (this.playing = !1),
    (this.crashed = !1),
    (this.paused = !1),
    (this.inverted = !1),
    (this.invertTimer = 0),
    (this.resizeTimerId_ = null),
    (this.playCount = 0),
    (this.audioBuffer = null),
    (this.soundFx = {}),
    (this.generatedSoundFx = null),
    (this.audioContext = null),
    (this.images = {}),
    (this.imagesLoaded = 0),
    (this.pollingGamepads = !1),
    (this.gamepadIndex = void 0),
    (this.previousGamepad = null),
    this.isDisabled()
      ? this.setupDisabledRunner()
      : (Runner.isAltGameModeEnabled() &&
          (this.initAltGameType(), (Runner.gameType = this.gameType)),
        this.loadImages(),
        (window.initializeEasterEggHighScore =
          this.initializeHighScore.bind(this)));
}
const DEFAULT_WIDTH = 600,
  FPS = 60,
  IS_HIDPI = window.devicePixelRatio > 1,
  IS_IOS = /CriOS/.test(window.navigator.userAgent),
  IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS,
  IS_RTL = "rtl" == document.querySelector("html").dir,
  ARCADE_MODE_URL = "chrome://dino/",
  RESOURCE_POSTFIX = "offline-resources-",
  A11Y_STRINGS = {
    ariaLabel: "dinoGameA11yAriaLabel",
    description: "dinoGameA11yDescription",
    gameOver: "dinoGameA11yGameOver",
    highScore: "dinoGameA11yHighScore",
    jump: "dinoGameA11yJump",
    started: "dinoGameA11yStartGame",
    speedLabel: "dinoGameA11ySpeedToggle",
  };
function GeneratedSoundFx() {
  (this.audioCues = !1), (this.context = null), (this.panner = null);
}

function speakPhrase(phrase) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(phrase);
    window.speechSynthesis.getVoices();
    utterance.text = phrase;
    speechSynthesis.speak(utterance);
  }
}

function announcePhrase(phrase) {
  if (Runner.a11yStatusElement) {
    Runner.a11yStatusElement.textContent = "";
    Runner.a11yStatusElement.textContent = phrase;
  }
}

function getA11yString(key) {
  return loadTimeData && loadTimeData.valueExists(key)
    ? loadTimeData.getString(key)
    : "";
}

function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function vibrate(duration) {
  if (IS_MOBILE && window.navigator.vibrate) {
    window.navigator.vibrate(duration);
  }
}

function createCanvas(parentElement, width, height, additionalClass) {
  const canvas = document.createElement("canvas");
  canvas.className = additionalClass
    ? Runner.classes.CANVAS + " " + additionalClass
    : Runner.classes.CANVAS;
  canvas.width = width;
  canvas.height = height;
  parentElement.appendChild(canvas);
  return canvas;
}

function decodeBase64ToArrayBuffer(base64String) {
  const bufferLength = (base64String.length / 4) * 3;
  const binaryString = atob(base64String);
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const uintArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bufferLength; i++) {
    uintArray[i] = binaryString.charCodeAt(i);
  }
  return arrayBuffer;
}

function getTimeStamp() {
  return IS_IOS ? new Date().getTime() : performance.now();
}

function GameOverPanel(
  canvas,
  textImagePosition,
  restartImagePosition,
  canvasDimensions,
  altGameEndImagePosition,
  altGameModeActive,
) {
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext("2d");
  this.canvasDimensions = canvasDimensions;
  this.textImgPos = textImagePosition;
  this.restartImgPos = restartImagePosition;
  this.altGameEndImgPos = altGameEndImagePosition;
  this.altGameModeActive = altGameModeActive;
  this.frameTimeStamp = 0;
  this.animTimer = 0;
  this.currentFrame = 0;
  this.gameOverRafId = null;
  this.flashTimer = 0;
  this.flashCounter = 0;
  this.originalText = true;
}

function checkForCollision(tRex, obstacle, canvasContext) {
  const collisionBox1 = new CollisionBox(
      obstacle.xPos + 1,
      obstacle.yPos + 1,
      obstacle.config.WIDTH - 2,
      obstacle.config.HEIGHT - 2,
    ),
    collisionBox2 = new CollisionBox(
      tRex.xPos + 1,
      tRex.yPos + 1,
      tRex.typeConfig.width * tRex.size - 2,
      tRex.typeConfig.height - 2,
    );
  if (
    (canvasContext &&
      drawCollisionBoxes(canvasContext, collisionBox1, collisionBox2),
    boxCompare(collisionBox1, collisionBox2))
  ) {
    const tRexCollisionBoxes = tRex.collisionBoxes;
    let trexBoxes = [];
    trexBoxes = Runner.isAltGameModeEnabled()
      ? Runner.spriteDefinition.TREX.COLLISION_BOXES
      : obstacle.ducking
        ? Trex.collisionBoxes.DUCKING
        : Trex.collisionBoxes.RUNNING;
    for (let i = 0; i < trexBoxes.length; i++) {
      for (let j = 0; j < tRexCollisionBoxes.length; j++) {
        const adjustedBox1 = createAdjustedCollisionBox(
            trexBoxes[i],
            collisionBox1,
          ),
          adjustedBox2 = createAdjustedCollisionBox(
            tRexCollisionBoxes[j],
            collisionBox2,
          ),
          isColliding = boxCompare(adjustedBox1, adjustedBox2);
        if (
          (canvasContext &&
            drawCollisionBoxes(canvasContext, adjustedBox1, adjustedBox2),
          isColliding)
        ) {
          return [adjustedBox1, adjustedBox2];
        }
      }
    }
  }
}

function createAdjustedCollisionBox(collisionBox, offsetBox) {
  return new CollisionBox(
    collisionBox.x + offsetBox.x,
    collisionBox.y + offsetBox.y,
    collisionBox.width,
    collisionBox.height,
  );
}

function drawCollisionBoxes(context, box1, box2) {
  context.save();
  context.strokeStyle = "#f00";
  context.strokeRect(box1.x, box1.y, box1.width, box1.height);
  context.strokeStyle = "#0f0";
  context.strokeRect(box2.x, box2.y, box2.width, box2.height);
  context.restore();
}

function boxCompare(box1, box2) {
  let isColliding = false;
  return (
    box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.height + box1.y > box2.y &&
      (isColliding = true),
    isColliding
  );
}

function CollisionBox(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

function Obstacle(
  canvasContext,
  typeConfig,
  spritePosition,
  dimensions,
  gapCoefficient,
  speed,
  xOffset,
  altGameModeActive,
) {
  this.canvasCtx = canvasContext;
  this.spritePos = spritePosition;
  this.typeConfig = typeConfig;
  this.gapCoefficient = Runner.slowDown ? 2 * gapCoefficient : gapCoefficient;
  this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
  this.dimensions = dimensions;
  this.remove = false;
  this.xPos = dimensions.WIDTH + (xOffset || 0);
  this.yPos = 0;
  this.width = 0;
  this.collisionBoxes = [];
  this.gap = 0;
  this.speedOffset = 0;
  this.altGameModeActive = altGameModeActive;
  this.imageSprite =
    typeConfig.type === "COLLECTABLE"
      ? Runner.altCommonImageSprite
      : this.altGameModeActive
        ? Runner.altGameImageSprite
        : Runner.imageSprite;
  this.currentFrame = 0;
  this.timer = 0;
  this.init(speed);
}

function Trex(canvas, spritePosition) {
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext("2d");
  this.spritePos = spritePosition;
  this.xPos = 0;
  this.yPos = 0;
  this.xInitialPos = 0;
  this.groundYPos = 0;
  this.currentFrame = 0;
  this.currentAnimFrames = [];
  this.blinkDelay = 0;
  this.blinkCount = 0;
  this.animStartTime = 0;
  this.timer = 0;
  this.msPerFrame = 1000 / FPS;
  this.config = Object.assign(Trex.config, Trex.normalJumpConfig);
  this.status = Trex.status.WAITING;
  this.jumping = false;
  this.ducking = false;
  this.jumpVelocity = 0;
  this.reachedMinHeight = false;
  this.speedDrop = false;
  this.jumpCount = 0;
  this.jumpspotX = 0;
  this.altGameModeEnabled = false;
  this.flashing = false;
  this.init();
}

function DistanceMeter(canvas, spritePosition, canvasWidth) {
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext("2d");
  this.image = Runner.imageSprite;
  this.spritePos = spritePosition;
  this.x = 0;
  this.y = 5;
  this.currentDistance = 0;
  this.maxScore = 0;
  this.highScore = "0";
  this.container = null;
  this.digits = [];
  this.achievement = false;
  this.defaultString = "";
  this.flashTimer = 0;
  this.flashIterations = 0;
  this.invertTrigger = false;
  this.flashingRafId = null;
  this.highScoreBounds = {};
  this.highScoreFlashing = false;
  this.config = DistanceMeter.config;
  this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
  this.canvasWidth = canvasWidth;
  this.init(canvasWidth);
}

function Cloud(canvas, spritePosition, containerWidth) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext("2d");
  this.spritePos = spritePosition;
  this.containerWidth = containerWidth;
  this.xPos = containerWidth;
  this.yPos = 0;
  this.remove = false;
  this.gap = getRandomNum(
    Cloud.config.MIN_CLOUD_GAP,
    Cloud.config.MAX_CLOUD_GAP,
  );
  this.init();
}

function BackgroundEl(canvas, spritePosition, containerWidth, type) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext("2d");
  this.spritePos = spritePosition;
  this.containerWidth = containerWidth;
  this.xPos = containerWidth;
  this.yPos = 0;
  this.remove = false;
  this.type = type;
  this.gap = getRandomNum(
    BackgroundEl.config.MIN_GAP,
    BackgroundEl.config.MAX_GAP,
  );
  this.animTimer = 0;
  this.switchFrames = false;
  this.spriteConfig = {};
  this.init();
}

function NightMode(canvas, spritePosition, containerWidth) {
  this.spritePos = spritePosition;
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext("2d");
  this.xPos = containerWidth - 50;
  this.yPos = 30;
  this.currentPhase = 0;
  this.opacity = 0;
  this.containerWidth = containerWidth;
  this.stars = [];
  this.drawStars = false;
  this.placeStars();
}

function HorizonLine(canvas, dimensions) {
  let sourceX = dimensions.SOURCE_X,
    sourceY = dimensions.SOURCE_Y;
  if (IS_HIDPI) {
    sourceX *= 2;
    sourceY *= 2;
  }
  this.spritePos = { x: sourceX, y: sourceY };
  this.canvas = canvas;
  this.canvasCtx = canvas.getContext("2d");
  this.sourceDimensions = {};
  this.dimensions = dimensions;
  this.sourceXPos = [
    this.spritePos.x,
    this.spritePos.x + this.dimensions.WIDTH,
  ];
  this.xPos = [];
  this.yPos = 0;
  this.bumpThreshold = 0.5;
  this.setSourceDimensions(dimensions);
  this.draw();
}

function Horizon(canvas, spritePosition, dimensions, gapCoefficient) {
  this.canvas = canvas;
  this.canvasCtx = this.canvas.getContext("2d");
  this.config = Horizon.config;
  this.dimensions = dimensions;
  this.gapCoefficient = gapCoefficient;
  this.obstacles = [];
  this.obstacleHistory = [];
  this.horizonOffsets = [0, 0];
  this.cloudFrequency = this.config.CLOUD_FREQUENCY;
  this.spritePos = spritePosition;
  this.nightMode = null;
  this.altGameModeActive = false;
  this.clouds = [];
  this.cloudSpeed = this.config.BG_CLOUD_SPEED;
  this.backgroundEls = [];
  this.lastEl = null;
  this.backgroundSpeed = this.config.BG_CLOUD_SPEED;
  this.horizonLine = null;
  this.horizonLines = [];
  this.init();
}
(Runner.config = {
  AUDIOCUE_PROXIMITY_THRESHOLD: 190,
  AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
  BG_CLOUD_SPEED: 0.2,
  BOTTOM_PAD: 10,
  CANVAS_IN_VIEW_OFFSET: -10,
  CLEAR_TIME: 3e3,
  CLOUD_FREQUENCY: 0.5,
  FADE_DURATION: 1,
  FLASH_DURATION: 1e3,
  GAMEOVER_CLEAR_TIME: 1200,
  INITIAL_JUMP_VELOCITY: 12,
  INVERT_FADE_DURATION: 12e3,
  MAX_BLINK_COUNT: 3,
  MAX_CLOUDS: 6,
  MAX_OBSTACLE_LENGTH: 3,
  MAX_OBSTACLE_DUPLICATION: 2,
  RESOURCE_TEMPLATE_ID: "audio-resources",
  SPEED: 6,
  SPEED_DROP_COEFFICIENT: 3,
  ARCADE_MODE_INITIAL_TOP_POSITION: 35,
  ARCADE_MODE_TOP_POSITION_PERCENT: 0.1,
}),
  (Runner.normalConfig = {
    ACCELERATION: 0.001,
    AUDIOCUE_PROXIMITY_THRESHOLD: 190,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
    GAP_COEFFICIENT: 0.6,
    INVERT_DISTANCE: 700,
    MAX_SPEED: 13,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    SPEED: 6,
  }),
  (Runner.slowConfig = {
    ACCELERATION: 5e-4,
    AUDIOCUE_PROXIMITY_THRESHOLD: 170,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 220,
    GAP_COEFFICIENT: 0.3,
    INVERT_DISTANCE: 350,
    MAX_SPEED: 9,
    MOBILE_SPEED_COEFFICIENT: 1.5,
    SPEED: 4.2,
  }),
  (Runner.defaultDimensions = { WIDTH: 600, HEIGHT: 150 }),
  (Runner.classes = {
    ARCADE_MODE: "arcade-mode",
    CANVAS: "runner-canvas",
    CONTAINER: "runner-container",
    CRASHED: "crashed",
    ICON: "icon-offline",
    INVERTED: "inverted",
    SNACKBAR: "snackbar",
    SNACKBAR_SHOW: "snackbar-show",
    TOUCH_CONTROLLER: "controller",
  }),
  (Runner.sounds = {
    BUTTON_PRESS: "offline-sound-press",
    HIT: "offline-sound-hit",
    SCORE: "offline-sound-reached",
  }),
  (Runner.keycodes = {
    JUMP: { 38: 1, 32: 1 },
    DUCK: { 40: 1 },
    RESTART: { 13: 1 },
  }),
  (Runner.events = {
    ANIM_END: "webkitAnimationEnd",
    CLICK: "click",
    KEYDOWN: "keydown",
    KEYUP: "keyup",
    POINTERDOWN: "pointerdown",
    POINTERUP: "pointerup",
    RESIZE: "resize",
    TOUCHEND: "touchend",
    TOUCHSTART: "touchstart",
    VISIBILITY: "visibilitychange",
    BLUR: "blur",
    FOCUS: "focus",
    LOAD: "load",
    GAMEPADCONNECTED: "gamepadconnected",
  }),
  (Runner.prototype = {
    initAltGameType() {
      GAME_TYPE.length > 0 &&
        (this.gameType =
          loadTimeData && loadTimeData.valueExists("altGameType")
            ? GAME_TYPE[parseInt(loadTimeData.getValue("altGameType"), 10) - 1]
            : "");
    },
    isDisabled: () =>
      loadTimeData && loadTimeData.valueExists("disabledEasterEgg"),
    setupDisabledRunner() {
      (this.containerEl = document.createElement("div")),
        (this.containerEl.className = Runner.classes.SNACKBAR),
        (this.containerEl.textContent =
          loadTimeData.getValue("disabledEasterEgg")),
        this.outerContainerEl.appendChild(this.containerEl),
        document.addEventListener(
          Runner.events.KEYDOWN,
          function (t) {
            Runner.keycodes.JUMP[t.keyCode] &&
              (this.containerEl.classList.add(Runner.classes.SNACKBAR_SHOW),
              document.querySelector(".icon").classList.add("icon-disabled"));
          }.bind(this),
        );
    },
    updateConfigSetting(t, e) {
      if (t in this.config && void 0 !== e)
        switch (((this.config[t] = e), t)) {
          case "GRAVITY":
          case "MIN_JUMP_HEIGHT":
          case "SPEED_DROP_COEFFICIENT":
            this.tRex.config[t] = e;
            break;
          case "INITIAL_JUMP_VELOCITY":
            this.tRex.setJumpVelocity(e);
            break;
          case "SPEED":
            this.setSpeed(e);
        }
    },
    createImageElement(t) {
      const e =
        loadTimeData && loadTimeData.valueExists(t)
          ? loadTimeData.getString(t)
          : null;
      if (e) {
        const i = document.createElement("img");
        return (
          (i.id = t),
          (i.src = e),
          document.getElementById("offline-resources").appendChild(i),
          i
        );
      }
      return null;
    },
    loadImages() {
      let t = "1x";
      (this.spriteDef = Runner.spriteDefinition.LDPI),
        IS_HIDPI &&
          ((t = "2x"), (this.spriteDef = Runner.spriteDefinition.HDPI)),
        (Runner.imageSprite = document.getElementById(RESOURCE_POSTFIX + t)),
        this.gameType &&
          ((Runner.altGameImageSprite = this.createImageElement(
            "altGameSpecificImage" + t,
          )),
          (Runner.altCommonImageSprite = this.createImageElement(
            "altGameCommonImage" + t,
          ))),
        (Runner.origImageSprite = Runner.imageSprite),
        (Runner.altGameImageSprite && Runner.altCommonImageSprite) ||
          ((Runner.isAltGameModeEnabled = () => !1),
          (this.altGameModeActive = !1)),
        Runner.imageSprite.complete
          ? this.init()
          : Runner.imageSprite.addEventListener(
              Runner.events.LOAD,
              this.init.bind(this),
            );
    },
    async loadSounds() {
      if (!IS_IOS) {
        this.audioContext = new AudioContext();
        const t = document.getElementById(
          this.config.RESOURCE_TEMPLATE_ID,
        ).content;
        for (const e in Runner.sounds) {
          let i = t.getElementById(Runner.sounds[e]).src;
          const s = await fetch(i).then((r) => r.arrayBuffer());
          // const s = decodeBase64ToArrayBuffer(
          //   (i = i.substr(i.indexOf(",") + 1)),
          // );
          this.audioContext.decodeAudioData(
            s,
            function (t, e) {
              this.soundFx[t] = e;
            }.bind(this, e),
          );
        }
      }
    },
    setSpeed(t) {
      const e = t || this.currentSpeed;
      if (this.dimensions.WIDTH < 600) {
        const t = Runner.slowDown
          ? e
          : ((e * this.dimensions.WIDTH) / 600) *
            this.config.MOBILE_SPEED_COEFFICIENT;
        this.currentSpeed = t > e ? e : t;
      } else t && (this.currentSpeed = t);
    },
    init() {
      (document.querySelector("." + Runner.classes.ICON).style.visibility =
        "hidden"),
        this.adjustDimensions(),
        this.setSpeed();
      const t = getA11yString(A11Y_STRINGS.ariaLabel);
      (this.containerEl = document.createElement("div")),
        this.containerEl.setAttribute(
          "role",
          IS_MOBILE ? "button" : "application",
        ),
        this.containerEl.setAttribute("tabindex", "0"),
        this.containerEl.setAttribute("title", t),
        (this.containerEl.className = Runner.classes.CONTAINER),
        (this.canvas = createCanvas(
          this.containerEl,
          this.dimensions.WIDTH,
          this.dimensions.HEIGHT,
        )),
        (this.a11yStatusEl = document.createElement("span")),
        (this.a11yStatusEl.className = "offline-runner-live-region"),
        this.a11yStatusEl.setAttribute("aria-live", "assertive"),
        (this.a11yStatusEl.textContent = ""),
        (Runner.a11yStatusEl = this.a11yStatusEl),
        (this.slowSpeedCheckboxLabel = document.createElement("label")),
        (this.slowSpeedCheckboxLabel.className = "slow-speed-option hidden"),
        (this.slowSpeedCheckboxLabel.textContent = getA11yString(
          A11Y_STRINGS.speedLabel,
        )),
        (this.slowSpeedCheckbox = document.createElement("input")),
        this.slowSpeedCheckbox.setAttribute("type", "checkbox"),
        this.slowSpeedCheckbox.setAttribute(
          "title",
          getA11yString(A11Y_STRINGS.speedLabel),
        ),
        this.slowSpeedCheckbox.setAttribute("tabindex", "0"),
        this.slowSpeedCheckbox.setAttribute("checked", "checked"),
        (this.slowSpeedToggleEl = document.createElement("span")),
        (this.slowSpeedToggleEl.className = "slow-speed-toggle"),
        this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedCheckbox),
        this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedToggleEl),
        IS_IOS
          ? this.outerContainerEl.appendChild(this.a11yStatusEl)
          : this.containerEl.appendChild(this.a11yStatusEl),
        announcePhrase(getA11yString(A11Y_STRINGS.description)),
        (this.generatedSoundFx = new GeneratedSoundFx()),
        (this.canvasCtx = this.canvas.getContext("2d")),
        (this.canvasCtx.fillStyle = "#f7f7f7"),
        this.canvasCtx.fill(),
        Runner.updateCanvasScaling(this.canvas),
        (this.horizon = new Horizon(
          this.canvas,
          this.spriteDef,
          this.dimensions,
          this.config.GAP_COEFFICIENT,
        )),
        (this.distanceMeter = new DistanceMeter(
          this.canvas,
          this.spriteDef.TEXT_SPRITE,
          this.dimensions.WIDTH,
        )),
        (this.tRex = new Trex(this.canvas, this.spriteDef.TREX)),
        this.outerContainerEl.appendChild(this.containerEl),
        this.outerContainerEl.appendChild(this.slowSpeedCheckboxLabel),
        this.startListening(),
        this.update(),
        window.addEventListener(
          Runner.events.RESIZE,
          this.debounceResize.bind(this),
        );
      const e = window.matchMedia("(prefers-color-scheme: dark)");
      (this.isDarkMode = e && e.matches),
        e.addListener((t) => {
          this.isDarkMode = t.matches;
        });
    },
    createTouchController() {
      (this.touchController = document.createElement("div")),
        (this.touchController.className = Runner.classes.TOUCH_CONTROLLER),
        this.touchController.addEventListener(Runner.events.TOUCHSTART, this),
        this.touchController.addEventListener(Runner.events.TOUCHEND, this),
        this.outerContainerEl.appendChild(this.touchController);
    },
    debounceResize() {
      this.resizeTimerId_ ||
        (this.resizeTimerId_ = setInterval(
          this.adjustDimensions.bind(this),
          250,
        ));
    },
    adjustDimensions() {
      clearInterval(this.resizeTimerId_), (this.resizeTimerId_ = null);
      const t = window.getComputedStyle(this.outerContainerEl),
        e = Number(t.paddingLeft.substr(0, t.paddingLeft.length - 2));
      (this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - 2 * e),
        this.isArcadeMode() &&
          ((this.dimensions.WIDTH = Math.min(600, this.dimensions.WIDTH)),
          this.activated && this.setArcadeModeContainerScale()),
        this.canvas &&
          ((this.canvas.width = this.dimensions.WIDTH),
          (this.canvas.height = this.dimensions.HEIGHT),
          Runner.updateCanvasScaling(this.canvas),
          this.distanceMeter.calcXPos(this.dimensions.WIDTH),
          this.clearCanvas(),
          this.horizon.update(0, 0, !0),
          this.tRex.update(0),
          this.playing || this.crashed || this.paused
            ? ((this.containerEl.style.width = this.dimensions.WIDTH + "px"),
              (this.containerEl.style.height = this.dimensions.HEIGHT + "px"),
              this.distanceMeter.update(0, Math.ceil(this.distanceRan)),
              this.stop())
            : this.tRex.draw(0, 0),
          this.crashed &&
            this.gameOverPanel &&
            (this.gameOverPanel.updateDimensions(this.dimensions.WIDTH),
            this.gameOverPanel.draw(this.altGameModeActive, this.tRex)));
    },
    playIntro() {
      if (this.activated || this.crashed) this.crashed && this.restart();
      else {
        (this.playingIntro = !0), (this.tRex.playingIntro = !0);
        const t =
          "@-webkit-keyframes intro { from { width:" +
          Trex.config.WIDTH +
          "px }to { width: " +
          this.dimensions.WIDTH +
          "px }}";
        document.styleSheets[0].insertRule(t, 0),
          this.containerEl.addEventListener(
            Runner.events.ANIM_END,
            this.startGame.bind(this),
          ),
          (this.containerEl.style.webkitAnimation =
            "intro .4s ease-out 1 both"),
          (this.containerEl.style.width = this.dimensions.WIDTH + "px"),
          this.setPlayStatus(!0),
          (this.activated = !0);
      }
    },
    startGame() {
      this.isArcadeMode() && this.setArcadeMode(),
        this.toggleSpeed(),
        (this.runningTime = 0),
        (this.playingIntro = !1),
        (this.tRex.playingIntro = !1),
        (this.containerEl.style.webkitAnimation = ""),
        this.playCount++,
        this.generatedSoundFx.background(),
        announcePhrase(getA11yString(A11Y_STRINGS.started)),
        Runner.audioCues &&
          this.containerEl.setAttribute(
            "title",
            getA11yString(A11Y_STRINGS.jump),
          ),
        document.addEventListener(
          Runner.events.VISIBILITY,
          this.onVisibilityChange.bind(this),
        ),
        window.addEventListener(
          Runner.events.BLUR,
          this.onVisibilityChange.bind(this),
        ),
        window.addEventListener(
          Runner.events.FOCUS,
          this.onVisibilityChange.bind(this),
        );
    },
    clearCanvas() {
      this.canvasCtx.clearRect(
        0,
        0,
        this.dimensions.WIDTH,
        this.dimensions.HEIGHT,
      );
    },
    isCanvasInView() {
      return (
        this.containerEl.getBoundingClientRect().top >
        Runner.config.CANVAS_IN_VIEW_OFFSET
      );
    },
    enableAltGameMode() {
      (Runner.imageSprite = Runner.altGameImageSprite),
        (Runner.spriteDefinition =
          Runner.spriteDefinitionByType[Runner.gameType]),
        (this.spriteDef = IS_HIDPI
          ? Runner.spriteDefinition.HDPI
          : Runner.spriteDefinition.LDPI),
        (this.altGameModeActive = !0),
        this.tRex.enableAltGameMode(this.spriteDef.TREX),
        this.horizon.enableAltGameMode(this.spriteDef),
        this.generatedSoundFx.background();
    },
    update() {
      this.updatePending = !1;
      const t = getTimeStamp();
      let e = t - (this.time || t);
      if (
        (this.altGameModeFlashTimer < 0 || 0 === this.altGameModeFlashTimer
          ? ((this.altGameModeFlashTimer = null),
            this.tRex.setFlashing(!1),
            this.enableAltGameMode())
          : this.altGameModeFlashTimer > 0 &&
            ((this.altGameModeFlashTimer -= e), this.tRex.update(e), (e = 0)),
        (this.time = t),
        this.playing)
      ) {
        this.clearCanvas(),
          this.altGameModeActive &&
          this.fadeInTimer <= this.config.FADE_DURATION
            ? ((this.fadeInTimer += e / 1e3),
              (this.canvasCtx.globalAlpha = this.fadeInTimer))
            : (this.canvasCtx.globalAlpha = 1),
          this.tRex.jumping && this.tRex.updateJump(e),
          (this.runningTime += e);
        const t = this.runningTime > this.config.CLEAR_TIME;
        if (
          (1 !== this.tRex.jumpCount || this.playingIntro || this.playIntro(),
          this.playingIntro)
        )
          this.horizon.update(0, this.currentSpeed, t);
        else if (!this.crashed) {
          const i = this.isDarkMode ^ this.inverted;
          (e = this.activated ? e : 0),
            this.horizon.update(e, this.currentSpeed, t, i);
        }
        let i = t && checkForCollision(this.horizon.obstacles[0], this.tRex);
        if (Runner.audioCues && t) {
          const t = "COLLECTABLE" != this.horizon.obstacles[0].typeConfig.type;
          if (!this.horizon.obstacles[0].jumpAlerted) {
            const e = Runner.isMobileMouseInput
                ? Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y
                : Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD,
              i = e + e * Math.log10(this.currentSpeed / Runner.config.SPEED);
            this.horizon.obstacles[0].xPos < i &&
              (t && this.generatedSoundFx.jump(),
              (this.horizon.obstacles[0].jumpAlerted = !0));
          }
        }
        Runner.isAltGameModeEnabled() &&
          i &&
          "COLLECTABLE" == this.horizon.obstacles[0].typeConfig.type &&
          (this.horizon.removeFirstObstacle(),
          this.tRex.setFlashing(!0),
          (i = !1),
          (this.altGameModeFlashTimer = this.config.FLASH_DURATION),
          (this.runningTime = 0),
          this.generatedSoundFx.collect()),
          i
            ? this.gameOver()
            : ((this.distanceRan += (this.currentSpeed * e) / this.msPerFrame),
              this.currentSpeed < this.config.MAX_SPEED &&
                (this.currentSpeed += this.config.ACCELERATION));
        const s = this.distanceMeter.update(e, Math.ceil(this.distanceRan));
        if (
          (!Runner.audioCues && s && this.playSound(this.soundFx.SCORE),
          !Runner.isAltGameModeEnabled())
        )
          if (this.invertTimer > this.config.INVERT_FADE_DURATION)
            (this.invertTimer = 0), (this.invertTrigger = !1), this.invert(!1);
          else if (this.invertTimer) this.invertTimer += e;
          else {
            const t = this.distanceMeter.getActualDistance(
              Math.ceil(this.distanceRan),
            );
            t > 0 &&
              ((this.invertTrigger = !(t % this.config.INVERT_DISTANCE)),
              this.invertTrigger &&
                0 === this.invertTimer &&
                ((this.invertTimer += e), this.invert(!1)));
          }
      }
      (this.playing ||
        (!this.activated &&
          this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) &&
        (this.tRex.update(e), this.scheduleNextUpdate());
    },
    handleEvent(t) {
      return function (e, i) {
        switch (e) {
          case i.KEYDOWN:
          case i.TOUCHSTART:
          case i.POINTERDOWN:
            this.onKeyDown(t);
            break;
          case i.KEYUP:
          case i.TOUCHEND:
          case i.POINTERUP:
            this.onKeyUp(t);
            break;
          case i.GAMEPADCONNECTED:
            this.onGamepadConnected(t);
        }
      }.bind(this)(t.type, Runner.events);
    },
    handleCanvasKeyPress(t) {
      this.activated || Runner.audioCues
        ? t.keyCode && Runner.keycodes.JUMP[t.keyCode] && this.onKeyDown(t)
        : (this.toggleSpeed(),
          (Runner.audioCues = !0),
          this.generatedSoundFx.init(),
          (Runner.generatedSoundFx = this.generatedSoundFx),
          (Runner.config.CLEAR_TIME *= 1.2));
    },
    preventScrolling(t) {
      32 === t.keyCode && t.preventDefault();
    },
    toggleSpeed() {
      if (Runner.audioCues) {
        if (Runner.slowDown != this.slowSpeedCheckbox.checked) {
          Runner.slowDown = this.slowSpeedCheckbox.checked;
          const t = Runner.slowDown ? Runner.slowConfig : Runner.normalConfig;
          (Runner.config = Object.assign(Runner.config, t)),
            (this.currentSpeed = t.SPEED),
            this.tRex.enableSlowConfig(),
            this.horizon.adjustObstacleSpeed();
        }
        this.playing && this.disableSpeedToggle(!0);
      }
    },
    showSpeedToggle(t) {
      const e = t && "focus" == t.type;
      (Runner.audioCues || e) &&
        this.slowSpeedCheckboxLabel.classList.toggle(
          HIDDEN_CLASS,
          !e && !this.crashed,
        );
    },
    disableSpeedToggle(t) {
      t
        ? this.slowSpeedCheckbox.setAttribute("disabled", "disabled")
        : this.slowSpeedCheckbox.removeAttribute("disabled");
    },
    startListening() {
      this.containerEl.addEventListener(
        Runner.events.KEYDOWN,
        this.handleCanvasKeyPress.bind(this),
      ),
        IS_MOBILE ||
          this.containerEl.addEventListener(
            Runner.events.FOCUS,
            this.showSpeedToggle.bind(this),
          ),
        this.canvas.addEventListener(
          Runner.events.KEYDOWN,
          this.preventScrolling.bind(this),
        ),
        this.canvas.addEventListener(
          Runner.events.KEYUP,
          this.preventScrolling.bind(this),
        ),
        document.addEventListener(Runner.events.KEYDOWN, this),
        document.addEventListener(Runner.events.KEYUP, this),
        this.containerEl.addEventListener(Runner.events.TOUCHSTART, this),
        document.addEventListener(Runner.events.POINTERDOWN, this),
        document.addEventListener(Runner.events.POINTERUP, this),
        this.isArcadeMode() &&
          window.addEventListener(Runner.events.GAMEPADCONNECTED, this);
    },
    stopListening() {
      document.removeEventListener(Runner.events.KEYDOWN, this),
        document.removeEventListener(Runner.events.KEYUP, this),
        this.touchController &&
          (this.touchController.removeEventListener(
            Runner.events.TOUCHSTART,
            this,
          ),
          this.touchController.removeEventListener(
            Runner.events.TOUCHEND,
            this,
          )),
        this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this),
        document.removeEventListener(Runner.events.POINTERDOWN, this),
        document.removeEventListener(Runner.events.POINTERUP, this),
        this.isArcadeMode() &&
          window.removeEventListener(Runner.events.GAMEPADCONNECTED, this);
    },
    onKeyDown(t) {
      if (
        (IS_MOBILE && this.playing && t.preventDefault(), this.isCanvasInView())
      ) {
        if (
          Runner.keycodes.JUMP[t.keyCode] &&
          t.target == this.slowSpeedCheckbox
        )
          return;
        if (!this.crashed && !this.paused) {
          const e =
            (IS_MOBILE &&
              t.type === Runner.events.POINTERDOWN &&
              "mouse" == t.pointerType &&
              t.target == this.containerEl) ||
            (IS_IOS &&
              "touch" == t.pointerType &&
              document.activeElement == this.containerEl);
          Runner.keycodes.JUMP[t.keyCode] ||
          t.type === Runner.events.TOUCHSTART ||
          e ||
          (Runner.keycodes.DUCK[t.keyCode] && this.altGameModeActive)
            ? (t.preventDefault(),
              this.playing ||
                (this.touchController ||
                  t.type !== Runner.events.TOUCHSTART ||
                  this.createTouchController(),
                e && this.handleCanvasKeyPress(t),
                this.loadSounds(),
                this.setPlayStatus(!0),
                this.update(),
                window.errorPageController &&
                  errorPageController.trackEasterEgg()),
              this.tRex.jumping ||
                this.tRex.ducking ||
                (Runner.audioCues
                  ? this.generatedSoundFx.cancelFootSteps()
                  : this.playSound(this.soundFx.BUTTON_PRESS),
                this.tRex.startJump(this.currentSpeed)))
            : !this.altGameModeActive &&
              this.playing &&
              Runner.keycodes.DUCK[t.keyCode] &&
              (t.preventDefault(),
              this.tRex.jumping
                ? this.tRex.setSpeedDrop()
                : this.tRex.jumping ||
                  this.tRex.ducking ||
                  this.tRex.setDuck(!0));
        }
      }
    },
    onKeyUp(t) {
      const e = String(t.keyCode),
        i =
          Runner.keycodes.JUMP[e] ||
          t.type === Runner.events.TOUCHEND ||
          t.type === Runner.events.POINTERUP;
      if (this.isRunning() && i) this.tRex.endJump();
      else if (Runner.keycodes.DUCK[e])
        (this.tRex.speedDrop = !1), this.tRex.setDuck(!1);
      else if (this.crashed) {
        const i = getTimeStamp() - this.time;
        this.isCanvasInView() &&
          (Runner.keycodes.RESTART[e] ||
            this.isLeftClickOnCanvas(t) ||
            (i >= this.config.GAMEOVER_CLEAR_TIME &&
              Runner.keycodes.JUMP[e])) &&
          this.handleGameOverClicks(t);
      } else this.paused && i && (this.tRex.reset(), this.play());
    },
    onGamepadConnected(t) {
      this.pollingGamepads || this.pollGamepadState();
    },
    pollGamepadState() {
      const t = navigator.getGamepads();
      this.pollActiveGamepad(t),
        (this.pollingGamepads = !0),
        requestAnimationFrame(this.pollGamepadState.bind(this));
    },
    pollForActiveGamepad(t) {
      for (let e = 0; e < t.length; ++e)
        if (t[e] && t[e].buttons.length > 0 && t[e].buttons[0].pressed)
          return (this.gamepadIndex = e), void this.pollActiveGamepad(t);
    },
    pollActiveGamepad(t) {
      if (void 0 === this.gamepadIndex)
        return void this.pollForActiveGamepad(t);
      const e = t[this.gamepadIndex];
      if (!e)
        return (this.gamepadIndex = void 0), void this.pollForActiveGamepad(t);
      this.pollGamepadButton(e, 0, 38),
        e.buttons.length >= 2 && this.pollGamepadButton(e, 1, 40),
        e.buttons.length >= 10 && this.pollGamepadButton(e, 9, 13),
        (this.previousGamepad = e);
    },
    pollGamepadButton(t, e, i) {
      const s = t.buttons[e].pressed;
      let n = !1;
      if (
        (this.previousGamepad && (n = this.previousGamepad.buttons[e].pressed),
        s !== n)
      ) {
        const t = new KeyboardEvent(
          s ? Runner.events.KEYDOWN : Runner.events.KEYUP,
          { keyCode: i },
        );
        document.dispatchEvent(t);
      }
    },
    handleGameOverClicks(t) {
      t.target != this.slowSpeedCheckbox &&
        (t.preventDefault(),
        this.distanceMeter.hasClickedOnHighScore(t) && this.highestScore
          ? this.distanceMeter.isHighScoreFlashing()
            ? (this.saveHighScore(0, !0), this.distanceMeter.resetHighScore())
            : this.distanceMeter.startHighScoreFlashing()
          : (this.distanceMeter.cancelHighScoreFlashing(), this.restart()));
    },
    isLeftClickOnCanvas(t) {
      return (
        null != t.button &&
        t.button < 2 &&
        t.type === Runner.events.POINTERUP &&
        (t.target === this.canvas ||
          (IS_MOBILE && Runner.audioCues && t.target === this.containerEl))
      );
    },
    scheduleNextUpdate() {
      this.updatePending ||
        ((this.updatePending = !0),
        (this.raqId = requestAnimationFrame(this.update.bind(this))));
    },
    isRunning() {
      return !!this.raqId;
    },
    initializeHighScore(t) {
      (this.syncHighestScore = !0),
        (t = Math.ceil(t)) < this.highestScore
          ? window.errorPageController &&
            errorPageController.updateEasterEggHighScore(this.highestScore)
          : ((this.highestScore = t),
            this.distanceMeter.setHighScore(this.highestScore));
    },
    saveHighScore(t, e) {
      (this.highestScore = Math.ceil(t)),
        this.distanceMeter.setHighScore(this.highestScore),
        this.syncHighestScore &&
          window.errorPageController &&
          (e
            ? errorPageController.resetEasterEggHighScore()
            : errorPageController.updateEasterEggHighScore(this.highestScore));
    },
    gameOver() {
      if (
        (this.playSound(this.soundFx.HIT),
        vibrate(200),
        this.stop(),
        (this.crashed = !0),
        (this.distanceMeter.achievement = !1),
        this.tRex.update(100, Trex.status.CRASHED),
        !this.gameOverPanel)
      ) {
        const t = IS_HIDPI
          ? Runner.spriteDefinitionByType.original.HDPI
          : Runner.spriteDefinitionByType.original.LDPI;
        this.canvas &&
          (Runner.isAltGameModeEnabled
            ? (this.gameOverPanel = new GameOverPanel(
                this.canvas,
                t.TEXT_SPRITE,
                t.RESTART,
                this.dimensions,
                t.ALT_GAME_END,
                this.altGameModeActive,
              ))
            : (this.gameOverPanel = new GameOverPanel(
                this.canvas,
                t.TEXT_SPRITE,
                t.RESTART,
                this.dimensions,
              )));
      }
      this.gameOverPanel.draw(this.altGameModeActive, this.tRex),
        this.distanceRan > this.highestScore &&
          this.saveHighScore(this.distanceRan),
        (this.time = getTimeStamp()),
        Runner.audioCues &&
          (this.generatedSoundFx.stopAll(),
          announcePhrase(
            getA11yString(A11Y_STRINGS.gameOver).replace(
              "$1",
              this.distanceMeter.getActualDistance(this.distanceRan).toString(),
            ) +
              " " +
              getA11yString(A11Y_STRINGS.highScore).replace(
                "$1",
                this.distanceMeter
                  .getActualDistance(this.highestScore)
                  .toString(),
              ),
          ),
          this.containerEl.setAttribute(
            "title",
            getA11yString(A11Y_STRINGS.ariaLabel),
          )),
        this.showSpeedToggle(),
        this.disableSpeedToggle(!1);
    },
    stop() {
      this.setPlayStatus(!1),
        (this.paused = !0),
        cancelAnimationFrame(this.raqId),
        (this.raqId = 0),
        this.generatedSoundFx.stopAll();
    },
    play() {
      this.crashed ||
        (this.setPlayStatus(!0),
        (this.paused = !1),
        this.tRex.update(0, Trex.status.RUNNING),
        (this.time = getTimeStamp()),
        this.update(),
        this.generatedSoundFx.background());
    },
    restart() {
      this.raqId ||
        (this.playCount++,
        (this.runningTime = 0),
        this.setPlayStatus(!0),
        this.toggleSpeed(),
        (this.paused = !1),
        (this.crashed = !1),
        (this.distanceRan = 0),
        this.setSpeed(this.config.SPEED),
        (this.time = getTimeStamp()),
        this.containerEl.classList.remove(Runner.classes.CRASHED),
        this.clearCanvas(),
        this.distanceMeter.reset(),
        this.horizon.reset(),
        this.tRex.reset(),
        this.playSound(this.soundFx.BUTTON_PRESS),
        this.invert(!0),
        (this.flashTimer = null),
        this.update(),
        this.gameOverPanel.reset(),
        this.generatedSoundFx.background(),
        this.containerEl.setAttribute(
          "title",
          getA11yString(A11Y_STRINGS.jump),
        ),
        announcePhrase(getA11yString(A11Y_STRINGS.started)));
    },
    setPlayStatus(t) {
      this.touchController &&
        this.touchController.classList.toggle(HIDDEN_CLASS, !t),
        (this.playing = t);
    },
    isArcadeMode: () =>
      IS_RTL
        ? 1 == document.title.indexOf(ARCADE_MODE_URL)
        : document.title === ARCADE_MODE_URL,
    setArcadeMode() {
      document.body.classList.add(Runner.classes.ARCADE_MODE),
        this.setArcadeModeContainerScale();
    },
    setArcadeModeContainerScale() {
      const t = window.innerHeight,
        e = t / this.dimensions.HEIGHT,
        i = window.innerWidth / this.dimensions.WIDTH,
        s = Math.max(1, Math.min(e, i)),
        n = this.dimensions.HEIGHT * s,
        a =
          Math.ceil(
            Math.max(
              0,
              (t - n - Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
                Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT,
            ),
          ) * window.devicePixelRatio,
        o = IS_RTL ? -s + "," + s : s;
      this.containerEl.style.transform =
        "scale(" + o + ") translateY(" + a + "px)";
    },
    onVisibilityChange(t) {
      document.hidden ||
      document.webkitHidden ||
      "blur" === t.type ||
      "visible" !== document.visibilityState
        ? this.stop()
        : this.crashed || (this.tRex.reset(), this.play());
    },
    playSound(t) {
      if (t) {
        const e = this.audioContext.createBufferSource();
        (e.buffer = t), e.connect(this.audioContext.destination), e.start(0);
      }
    },
    invert(t) {
      const e = document.firstElementChild;
      t
        ? (e.classList.toggle(Runner.classes.INVERTED, !1),
          (this.invertTimer = 0),
          (this.inverted = !1))
        : (this.inverted = e.classList.toggle(
            Runner.classes.INVERTED,
            this.invertTrigger,
          ));
    },
  }),
  (Runner.updateCanvasScaling = function (t, e, i) {
    const s = t.getContext("2d"),
      n = Math.floor(window.devicePixelRatio) || 1,
      a = Math.floor(s.webkitBackingStorePixelRatio) || 1,
      o = n / a;
    if (n !== a) {
      const n = e || t.width,
        a = i || t.height;
      return (
        (t.width = n * o),
        (t.height = a * o),
        (t.style.width = n + "px"),
        (t.style.height = a + "px"),
        s.scale(o, o),
        !0
      );
    }
    return (
      1 === n &&
        ((t.style.width = t.width + "px"), (t.style.height = t.height + "px")),
      !1
    );
  }),
  (Runner.isAltGameModeEnabled = function () {
    return loadTimeData && loadTimeData.valueExists("enableAltGameMode");
  }),
  (GeneratedSoundFx.prototype = {
    init() {
      (this.audioCues = !0),
        this.context ||
          ((this.context = window.webkitAudioContext
            ? new webkitAudioContext()
            : new AudioContext()),
          IS_IOS &&
            ((this.context.onstatechange = function () {
              "running" != this.context.state && this.context.resume();
            }.bind(this)),
            this.context.resume()),
          (this.panner = this.context.createStereoPanner
            ? this.context.createStereoPanner()
            : null));
    },
    stopAll() {
      this.cancelFootSteps();
    },
    playNote(t, e, i, s, n) {
      const a = this.context.createOscillator(),
        o = this.context.createOscillator(),
        h = this.context.createGain();
      (a.type = "triangle"),
        (o.type = "triangle"),
        (h.gain.value = 0.1),
        this.panner
          ? ((this.panner.pan.value = n || 0),
            a.connect(h).connect(this.panner),
            o.connect(h).connect(this.panner),
            this.panner.connect(this.context.destination))
          : (a.connect(h), o.connect(h), h.connect(this.context.destination)),
        (a.frequency.value = t + 1),
        (o.frequency.value = t - 2),
        h.gain.setValueAtTime(s || 0.01, e + i - 0.05),
        h.gain.linearRampToValueAtTime(1e-5, e + i),
        a.start(e),
        o.start(e),
        a.stop(e + i),
        o.stop(e + i);
    },
    background() {
      if (this.audioCues) {
        const t = this.context.currentTime;
        this.playNote(493.883, t, 0.116),
          this.playNote(659.255, t + 0.116, 0.232),
          this.loopFootSteps();
      }
    },
    loopFootSteps() {
      this.audioCues &&
        !this.bgSoundIntervalId &&
        (this.bgSoundIntervalId = setInterval(
          function () {
            this.playNote(73.42, this.context.currentTime, 0.05, 0.16),
              this.playNote(
                69.3,
                this.context.currentTime + 0.116,
                0.116,
                0.16,
              );
          }.bind(this),
          280,
        ));
    },
    cancelFootSteps() {
      this.audioCues &&
        this.bgSoundIntervalId &&
        (clearInterval(this.bgSoundIntervalId),
        (this.bgSoundIntervalId = null),
        this.playNote(103.83, this.context.currentTime, 0.232, 0.02),
        this.playNote(116.54, this.context.currentTime + 0.116, 0.232, 0.02));
    },
    collect() {
      if (this.audioCues) {
        this.cancelFootSteps();
        const t = this.context.currentTime;
        this.playNote(830.61, t, 0.116),
          this.playNote(1318.51, t + 0.116, 0.232);
      }
    },
    jump() {
      if (this.audioCues) {
        const t = this.context.currentTime;
        this.playNote(659.25, t, 0.116, 0.3, -0.6),
          this.playNote(880, t + 0.116, 0.232, 0.3, -0.6);
      }
    },
  }),
  (GameOverPanel.RESTART_ANIM_DURATION = 875),
  (GameOverPanel.LOGO_PAUSE_DURATION = 875),
  (GameOverPanel.FLASH_ITERATIONS = 5),
  (GameOverPanel.animConfig = {
    frames: [0, 36, 72, 108, 144, 180, 216, 252],
    msPerFrame: GameOverPanel.RESTART_ANIM_DURATION / 8,
  }),
  (GameOverPanel.dimensions = {
    TEXT_X: 0,
    TEXT_Y: 13,
    TEXT_WIDTH: 191,
    TEXT_HEIGHT: 11,
    RESTART_WIDTH: 36,
    RESTART_HEIGHT: 32,
  }),
  (GameOverPanel.prototype = {
    updateDimensions(t, e) {
      (this.canvasDimensions.WIDTH = t),
        e && (this.canvasDimensions.HEIGHT = e),
        (this.currentFrame = GameOverPanel.animConfig.frames.length - 1);
    },
    drawGameOverText(t, e) {
      const i = this.canvasDimensions.WIDTH / 2;
      let s = t.TEXT_X,
        n = t.TEXT_Y,
        a = t.TEXT_WIDTH,
        o = t.TEXT_HEIGHT;
      const h = Math.round(i - t.TEXT_WIDTH / 2),
        r = Math.round((this.canvasDimensions.HEIGHT - 25) / 3),
        c = t.TEXT_WIDTH,
        l = t.TEXT_HEIGHT;
      IS_HIDPI && ((n *= 2), (s *= 2), (a *= 2), (o *= 2)),
        e || ((s += this.textImgPos.x), (n += this.textImgPos.y));
      const d = e ? Runner.altCommonImageSprite : Runner.origImageSprite;
      this.canvasCtx.save(),
        IS_RTL &&
          (this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0),
          this.canvasCtx.scale(-1, 1)),
        this.canvasCtx.drawImage(d, s, n, a, o, h, r, c, l),
        this.canvasCtx.restore();
    },
    drawAltGameElements(t) {
      if (
        this.altGameModeActive &&
        Runner.spriteDefinition.ALT_GAME_END_CONFIG
      ) {
        const e = Runner.spriteDefinition.ALT_GAME_END_CONFIG;
        let i = e.WIDTH,
          s = e.HEIGHT;
        const n = t.xPos + e.X_OFFSET,
          a = t.yPos + e.Y_OFFSET;
        IS_HIDPI && ((i *= 2), (s *= 2)),
          this.canvasCtx.drawImage(
            Runner.altCommonImageSprite,
            this.altGameEndImgPos.x,
            this.altGameEndImgPos.y,
            i,
            s,
            n,
            a,
            e.WIDTH,
            e.HEIGHT,
          );
      }
    },
    drawRestartButton() {
      const t = GameOverPanel.dimensions;
      let e = GameOverPanel.animConfig.frames[this.currentFrame],
        i = t.RESTART_WIDTH,
        s = t.RESTART_HEIGHT;
      const n = this.canvasDimensions.WIDTH / 2 - t.RESTART_WIDTH / 2,
        a = this.canvasDimensions.HEIGHT / 2;
      IS_HIDPI && ((i *= 2), (s *= 2), (e *= 2)),
        this.canvasCtx.save(),
        IS_RTL &&
          (this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0),
          this.canvasCtx.scale(-1, 1)),
        this.canvasCtx.drawImage(
          Runner.origImageSprite,
          this.restartImgPos.x + e,
          this.restartImgPos.y,
          i,
          s,
          n,
          a,
          t.RESTART_WIDTH,
          t.RESTART_HEIGHT,
        ),
        this.canvasCtx.restore();
    },
    draw(t, e) {
      t && (this.altGameModeActive = t),
        this.drawGameOverText(GameOverPanel.dimensions, !1),
        this.drawRestartButton(),
        this.drawAltGameElements(e),
        this.update();
    },
    update() {
      const t = getTimeStamp(),
        e = t - (this.frameTimeStamp || t);
      if (
        ((this.frameTimeStamp = t),
        (this.animTimer += e),
        (this.flashTimer += e),
        0 == this.currentFrame &&
          this.animTimer > GameOverPanel.LOGO_PAUSE_DURATION)
      )
        (this.animTimer = 0), this.currentFrame++, this.drawRestartButton();
      else if (
        this.currentFrame > 0 &&
        this.currentFrame < GameOverPanel.animConfig.frames.length
      )
        this.animTimer >= GameOverPanel.animConfig.msPerFrame &&
          (this.currentFrame++, this.drawRestartButton());
      else if (
        !this.altGameModeActive &&
        this.currentFrame == GameOverPanel.animConfig.frames.length
      )
        return void this.reset();
      if (
        this.altGameModeActive &&
        Runner.spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG
      ) {
        const t =
          Runner.spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG;
        if (
          this.flashCounter < GameOverPanel.FLASH_ITERATIONS &&
          this.flashTimer > t.FLASH_DURATION
        )
          (this.flashTimer = 0),
            (this.originalText = !this.originalText),
            this.clearGameOverTextBounds(),
            this.originalText
              ? (this.drawGameOverText(GameOverPanel.dimensions, !1),
                this.flashCounter++)
              : this.drawGameOverText(t, !0);
        else if (this.flashCounter >= GameOverPanel.FLASH_ITERATIONS)
          return void this.reset();
      }
      this.gameOverRafId = requestAnimationFrame(this.update.bind(this));
    },
    clearGameOverTextBounds() {
      this.canvasCtx.save(),
        this.canvasCtx.clearRect(
          Math.round(
            this.canvasDimensions.WIDTH / 2 -
              GameOverPanel.dimensions.TEXT_WIDTH / 2,
          ),
          Math.round((this.canvasDimensions.HEIGHT - 25) / 3),
          GameOverPanel.dimensions.TEXT_WIDTH,
          GameOverPanel.dimensions.TEXT_HEIGHT + 4,
        ),
        this.canvasCtx.restore();
    },
    reset() {
      this.gameOverRafId &&
        (cancelAnimationFrame(this.gameOverRafId), (this.gameOverRafId = null)),
        (this.animTimer = 0),
        (this.frameTimeStamp = 0),
        (this.currentFrame = 0),
        (this.flashTimer = 0),
        (this.flashCounter = 0),
        (this.originalText = !0);
    },
  }),
  (Obstacle.MAX_GAP_COEFFICIENT = 1.5),
  (Obstacle.MAX_OBSTACLE_LENGTH = 3),
  (Obstacle.prototype = {
    init(t) {
      if (
        (this.cloneCollisionBoxes(),
        this.size > 1 && this.typeConfig.multipleSpeed > t && (this.size = 1),
        (this.width = this.typeConfig.width * this.size),
        Array.isArray(this.typeConfig.yPos))
      ) {
        const t = IS_MOBILE ? this.typeConfig.yPosMobile : this.typeConfig.yPos;
        this.yPos = t[getRandomNum(0, t.length - 1)];
      } else this.yPos = this.typeConfig.yPos;
      this.draw(),
        this.size > 1 &&
          ((this.collisionBoxes[1].width =
            this.width -
            this.collisionBoxes[0].width -
            this.collisionBoxes[2].width),
          (this.collisionBoxes[2].x =
            this.width - this.collisionBoxes[2].width)),
        this.typeConfig.speedOffset &&
          (this.speedOffset =
            Math.random() > 0.5
              ? this.typeConfig.speedOffset
              : -this.typeConfig.speedOffset),
        (this.gap = this.getGap(this.gapCoefficient, t)),
        Runner.audioCues && (this.gap *= 2);
    },
    draw() {
      let t = this.typeConfig.width,
        e = this.typeConfig.height;
      IS_HIDPI && ((t *= 2), (e *= 2));
      let i = t * this.size * (0.5 * (this.size - 1)) + this.spritePos.x;
      this.currentFrame > 0 && (i += t * this.currentFrame),
        this.canvasCtx.drawImage(
          this.imageSprite,
          i,
          this.spritePos.y,
          t * this.size,
          e,
          this.xPos,
          this.yPos,
          this.typeConfig.width * this.size,
          this.typeConfig.height,
        );
    },
    update(t, e) {
      this.remove ||
        (this.typeConfig.speedOffset && (e += this.speedOffset),
        (this.xPos -= Math.floor(((e * FPS) / 1e3) * t)),
        this.typeConfig.numFrames &&
          ((this.timer += t),
          this.timer >= this.typeConfig.frameRate &&
            ((this.currentFrame =
              this.currentFrame === this.typeConfig.numFrames - 1
                ? 0
                : this.currentFrame + 1),
            (this.timer = 0))),
        this.draw(),
        this.isVisible() || (this.remove = !0));
    },
    getGap(t, e) {
      const i = Math.round(this.width * e + this.typeConfig.minGap * t);
      return getRandomNum(i, Math.round(i * Obstacle.MAX_GAP_COEFFICIENT));
    },
    isVisible() {
      return this.xPos + this.width > 0;
    },
    cloneCollisionBoxes() {
      const t = this.typeConfig.collisionBoxes;
      for (let e = t.length - 1; e >= 0; e--)
        this.collisionBoxes[e] = new CollisionBox(
          t[e].x,
          t[e].y,
          t[e].width,
          t[e].height,
        );
    },
  }),
  (Trex.config = {
    DROP_VELOCITY: -5,
    FLASH_OFF: 175,
    FLASH_ON: 100,
    HEIGHT: 47,
    HEIGHT_DUCK: 25,
    INTRO_DURATION: 1500,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44,
    WIDTH_DUCK: 59,
  }),
  (Trex.slowJumpConfig = {
    GRAVITY: 0.25,
    MAX_JUMP_HEIGHT: 50,
    MIN_JUMP_HEIGHT: 45,
    INITIAL_JUMP_VELOCITY: -20,
  }),
  (Trex.normalJumpConfig = {
    GRAVITY: 0.6,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    INITIAL_JUMP_VELOCITY: -10,
  }),
  (Trex.collisionBoxes = {
    DUCKING: [new CollisionBox(1, 18, 55, 25)],
    RUNNING: [
      new CollisionBox(22, 0, 17, 16),
      new CollisionBox(1, 18, 30, 9),
      new CollisionBox(10, 35, 14, 8),
      new CollisionBox(1, 24, 29, 5),
      new CollisionBox(5, 30, 21, 4),
      new CollisionBox(9, 34, 15, 4),
    ],
  }),
  (Trex.status = {
    CRASHED: "CRASHED",
    DUCKING: "DUCKING",
    JUMPING: "JUMPING",
    RUNNING: "RUNNING",
    WAITING: "WAITING",
  }),
  (Trex.BLINK_TIMING = 7e3),
  (Trex.animFrames = {
    WAITING: { frames: [44, 0], msPerFrame: 1e3 / 3 },
    RUNNING: { frames: [88, 132], msPerFrame: 1e3 / 12 },
    CRASHED: { frames: [220], msPerFrame: 1e3 / 60 },
    JUMPING: { frames: [0], msPerFrame: 1e3 / 60 },
    DUCKING: { frames: [264, 323], msPerFrame: 125 },
  }),
  (Trex.prototype = {
    init() {
      (this.groundYPos =
        Runner.defaultDimensions.HEIGHT -
        this.config.HEIGHT -
        Runner.config.BOTTOM_PAD),
        (this.yPos = this.groundYPos),
        (this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT),
        this.draw(0, 0),
        this.update(0, Trex.status.WAITING);
    },
    enableSlowConfig: function () {
      const t = Runner.slowDown ? Trex.slowJumpConfig : Trex.normalJumpConfig;
      (Trex.config = Object.assign(Trex.config, t)),
        this.adjustAltGameConfigForSlowSpeed();
    },
    enableAltGameMode: function (t) {
      (this.altGameModeEnabled = !0), (this.spritePos = t);
      const e = Runner.spriteDefinition.TREX;
      (Trex.animFrames.RUNNING.frames = [e.RUNNING_1.x, e.RUNNING_2.x]),
        (Trex.animFrames.CRASHED.frames = [e.CRASHED.x]),
        "object" == typeof e.JUMPING.x
          ? (Trex.animFrames.JUMPING.frames = e.JUMPING.x)
          : (Trex.animFrames.JUMPING.frames = [e.JUMPING.x]),
        (Trex.animFrames.DUCKING.frames = [e.RUNNING_1.x, e.RUNNING_2.x]),
        (Trex.config.GRAVITY = e.GRAVITY || Trex.config.GRAVITY),
        (Trex.config.HEIGHT = e.RUNNING_1.h),
        (Trex.config.INITIAL_JUMP_VELOCITY = e.INITIAL_JUMP_VELOCITY),
        (Trex.config.MAX_JUMP_HEIGHT = e.MAX_JUMP_HEIGHT),
        (Trex.config.MIN_JUMP_HEIGHT = e.MIN_JUMP_HEIGHT),
        (Trex.config.WIDTH = e.RUNNING_1.w),
        (Trex.config.WIDTH_JUMP = e.JUMPING.w),
        (Trex.config.INVERT_JUMP = e.INVERT_JUMP),
        this.adjustAltGameConfigForSlowSpeed(e.GRAVITY),
        (this.config = Trex.config),
        (this.groundYPos =
          Runner.defaultDimensions.HEIGHT -
          this.config.HEIGHT -
          Runner.spriteDefinition.BOTTOM_PAD),
        (this.yPos = this.groundYPos),
        this.reset();
    },
    adjustAltGameConfigForSlowSpeed: function (t) {
      Runner.slowDown &&
        (t && (Trex.config.GRAVITY = t / 1.5),
        (Trex.config.MIN_JUMP_HEIGHT *= 1.5),
        (Trex.config.MAX_JUMP_HEIGHT *= 1.5),
        (Trex.config.INITIAL_JUMP_VELOCITY =
          1.5 * Trex.config.INITIAL_JUMP_VELOCITY));
    },
    setFlashing: function (t) {
      this.flashing = t;
    },
    setJumpVelocity(t) {
      (this.config.INITIAL_JUMP_VELOCITY = -t),
        (this.config.DROP_VELOCITY = -t / 2);
    },
    update(t, e) {
      (this.timer += t),
        e &&
          ((this.status = e),
          (this.currentFrame = 0),
          (this.msPerFrame = Trex.animFrames[e].msPerFrame),
          (this.currentAnimFrames = Trex.animFrames[e].frames),
          e === Trex.status.WAITING &&
            ((this.animStartTime = getTimeStamp()), this.setBlinkDelay())),
        this.playingIntro &&
          this.xPos < this.config.START_X_POS &&
          ((this.xPos += Math.round(
            (this.config.START_X_POS / this.config.INTRO_DURATION) * t,
          )),
          (this.xInitialPos = this.xPos)),
        this.status === Trex.status.WAITING
          ? this.blink(getTimeStamp())
          : this.draw(this.currentAnimFrames[this.currentFrame], 0),
        !this.flashing &&
          this.timer >= this.msPerFrame &&
          ((this.currentFrame =
            this.currentFrame == this.currentAnimFrames.length - 1
              ? 0
              : this.currentFrame + 1),
          (this.timer = 0)),
        this.altGameModeEnabled ||
          (this.speedDrop &&
            this.yPos === this.groundYPos &&
            ((this.speedDrop = !1), this.setDuck(!0)));
    },
    draw(t, e) {
      let i = t,
        s = e,
        n =
          this.ducking && this.status !== Trex.status.CRASHED
            ? this.config.WIDTH_DUCK
            : this.config.WIDTH,
        a = this.config.HEIGHT;
      const o = a;
      let h = Runner.spriteDefinition.TREX.JUMPING.xOffset;
      this.altGameModeEnabled &&
        this.jumping &&
        this.status !== Trex.status.CRASHED &&
        (n = this.config.WIDTH_JUMP),
        IS_HIDPI && ((i *= 2), (s *= 2), (n *= 2), (a *= 2), (h *= 2)),
        (i += this.spritePos.x),
        (s += this.spritePos.y),
        this.flashing &&
          (this.timer < this.config.FLASH_ON
            ? (this.canvasCtx.globalAlpha = 0.5)
            : this.timer > this.config.FLASH_OFF && (this.timer = 0)),
        !this.altGameModeEnabled &&
        this.ducking &&
        this.status !== Trex.status.CRASHED
          ? this.canvasCtx.drawImage(
              Runner.imageSprite,
              i,
              s,
              n,
              a,
              this.xPos,
              this.yPos,
              this.config.WIDTH_DUCK,
              o,
            )
          : this.altGameModeEnabled &&
              this.jumping &&
              this.status !== Trex.status.CRASHED
            ? this.canvasCtx.drawImage(
                Runner.imageSprite,
                i,
                s,
                n,
                a,
                this.xPos - h,
                this.yPos,
                this.config.WIDTH_JUMP,
                o,
              )
            : (this.ducking &&
                this.status === Trex.status.CRASHED &&
                this.xPos++,
              this.canvasCtx.drawImage(
                Runner.imageSprite,
                i,
                s,
                n,
                a,
                this.xPos,
                this.yPos,
                this.config.WIDTH,
                o,
              )),
        (this.canvasCtx.globalAlpha = 1);
    },
    setBlinkDelay() {
      this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
    },
    blink(t) {
      t - this.animStartTime >= this.blinkDelay &&
        (this.draw(this.currentAnimFrames[this.currentFrame], 0),
        1 === this.currentFrame &&
          (this.setBlinkDelay(), (this.animStartTime = t), this.blinkCount++));
    },
    startJump(t) {
      this.jumping ||
        (this.update(0, Trex.status.JUMPING),
        (this.jumpVelocity = this.config.INITIAL_JUMP_VELOCITY - t / 10),
        (this.jumping = !0),
        (this.reachedMinHeight = !1),
        (this.speedDrop = !1),
        this.config.INVERT_JUMP &&
          (this.minJumpHeight = this.groundYPos + this.config.MIN_JUMP_HEIGHT));
    },
    endJump() {
      this.reachedMinHeight &&
        this.jumpVelocity < this.config.DROP_VELOCITY &&
        (this.jumpVelocity = this.config.DROP_VELOCITY);
    },
    updateJump(t) {
      const e = t / Trex.animFrames[this.status].msPerFrame;
      this.speedDrop
        ? (this.yPos += Math.round(
            this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * e,
          ))
        : this.config.INVERT_JUMP
          ? (this.yPos -= Math.round(this.jumpVelocity * e))
          : (this.yPos += Math.round(this.jumpVelocity * e)),
        (this.jumpVelocity += this.config.GRAVITY * e),
        ((this.config.INVERT_JUMP && this.yPos > this.minJumpHeight) ||
          (!this.config.INVERT_JUMP && this.yPos < this.minJumpHeight) ||
          this.speedDrop) &&
          (this.reachedMinHeight = !0),
        ((this.config.INVERT_JUMP &&
          this.yPos > -this.config.MAX_JUMP_HEIGHT) ||
          (!this.config.INVERT_JUMP &&
            this.yPos < this.config.MAX_JUMP_HEIGHT) ||
          this.speedDrop) &&
          this.endJump(),
        ((this.config.INVERT_JUMP && this.yPos) < this.groundYPos ||
          (!this.config.INVERT_JUMP && this.yPos) > this.groundYPos) &&
          (this.reset(),
          this.jumpCount++,
          Runner.audioCues && Runner.generatedSoundFx.loopFootSteps());
    },
    setSpeedDrop() {
      (this.speedDrop = !0), (this.jumpVelocity = 1);
    },
    setDuck(t) {
      t && this.status !== Trex.status.DUCKING
        ? (this.update(0, Trex.status.DUCKING), (this.ducking = !0))
        : this.status === Trex.status.DUCKING &&
          (this.update(0, Trex.status.RUNNING), (this.ducking = !1));
    },
    reset() {
      (this.xPos = this.xInitialPos),
        (this.yPos = this.groundYPos),
        (this.jumpVelocity = 0),
        (this.jumping = !1),
        (this.ducking = !1),
        this.update(0, Trex.status.RUNNING),
        (this.midair = !1),
        (this.speedDrop = !1),
        (this.jumpCount = 0);
    },
  }),
  (DistanceMeter.dimensions = { WIDTH: 10, HEIGHT: 13, DEST_WIDTH: 11 }),
  (DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120]),
  (DistanceMeter.config = {
    MAX_DISTANCE_UNITS: 5,
    ACHIEVEMENT_DISTANCE: 100,
    COEFFICIENT: 0.025,
    FLASH_DURATION: 250,
    FLASH_ITERATIONS: 3,
    HIGH_SCORE_HIT_AREA_PADDING: 4,
  }),
  (DistanceMeter.prototype = {
    init(t) {
      let e = "";
      this.calcXPos(t), (this.maxScore = this.maxScoreUnits);
      for (let t = 0; t < this.maxScoreUnits; t++)
        this.draw(t, 0), (this.defaultString += "0"), (e += "9");
      this.maxScore = parseInt(e, 10);
    },
    calcXPos(t) {
      this.x =
        t - DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1);
    },
    draw(t, e, i) {
      let s = DistanceMeter.dimensions.WIDTH,
        n = DistanceMeter.dimensions.HEIGHT,
        a = DistanceMeter.dimensions.WIDTH * e,
        o = 0;
      const h = t * DistanceMeter.dimensions.DEST_WIDTH,
        r = this.y,
        c = DistanceMeter.dimensions.WIDTH,
        l = DistanceMeter.dimensions.HEIGHT;
      if (
        (IS_HIDPI && ((s *= 2), (n *= 2), (a *= 2)),
        (a += this.spritePos.x),
        (o += this.spritePos.y),
        this.canvasCtx.save(),
        IS_RTL)
      )
        i
          ? this.canvasCtx.translate(
              this.canvasWidth -
                DistanceMeter.dimensions.WIDTH * (this.maxScoreUnits + 3),
              this.y,
            )
          : this.canvasCtx.translate(
              this.canvasWidth - DistanceMeter.dimensions.WIDTH,
              this.y,
            ),
          this.canvasCtx.scale(-1, 1);
      else {
        const t =
          this.x - 2 * this.maxScoreUnits * DistanceMeter.dimensions.WIDTH;
        i
          ? this.canvasCtx.translate(t, this.y)
          : this.canvasCtx.translate(this.x, this.y);
      }
      this.canvasCtx.drawImage(this.image, a, o, s, n, h, r, c, l),
        this.canvasCtx.restore();
    },
    getActualDistance(t) {
      return t ? Math.round(t * this.config.COEFFICIENT) : 0;
    },
    update(t, e) {
      let i = !0,
        s = !1;
      if (this.achievement)
        this.flashIterations <= this.config.FLASH_ITERATIONS
          ? ((this.flashTimer += t),
            this.flashTimer < this.config.FLASH_DURATION
              ? (i = !1)
              : this.flashTimer > 2 * this.config.FLASH_DURATION &&
                ((this.flashTimer = 0), this.flashIterations++))
          : ((this.achievement = !1),
            (this.flashIterations = 0),
            (this.flashTimer = 0));
      else if (
        ((e = this.getActualDistance(e)) > this.maxScore &&
        this.maxScoreUnits == this.config.MAX_DISTANCE_UNITS
          ? (this.maxScoreUnits++,
            (this.maxScore = parseInt(this.maxScore + "9", 10)))
          : (this.distance = 0),
        e > 0)
      ) {
        e % this.config.ACHIEVEMENT_DISTANCE == 0 &&
          ((this.achievement = !0), (this.flashTimer = 0), (s = !0));
        const t = (this.defaultString + e).substr(-this.maxScoreUnits);
        this.digits = t.split("");
      } else this.digits = this.defaultString.split("");
      if (i)
        for (let t = this.digits.length - 1; t >= 0; t--)
          this.draw(t, parseInt(this.digits[t], 10));
      return this.drawHighScore(), s;
    },
    drawHighScore() {
      if (parseInt(this.highScore, 10) > 0) {
        this.canvasCtx.save(), (this.canvasCtx.globalAlpha = 0.8);
        for (let t = this.highScore.length - 1; t >= 0; t--)
          this.draw(t, parseInt(this.highScore[t], 10), !0);
        this.canvasCtx.restore();
      }
    },
    setHighScore(t) {
      t = this.getActualDistance(t);
      const e = (this.defaultString + t).substr(-this.maxScoreUnits);
      this.highScore = ["10", "11", ""].concat(e.split(""));
    },
    hasClickedOnHighScore(t) {
      let e = 0,
        i = 0;
      if (t.touches) {
        const s = this.canvas.getBoundingClientRect();
        (e = t.touches[0].clientX - s.left), (i = t.touches[0].clientY - s.top);
      } else (e = t.offsetX), (i = t.offsetY);
      return (
        (this.highScoreBounds = this.getHighScoreBounds()),
        e >= this.highScoreBounds.x &&
          e <= this.highScoreBounds.x + this.highScoreBounds.width &&
          i >= this.highScoreBounds.y &&
          i <= this.highScoreBounds.y + this.highScoreBounds.height
      );
    },
    getHighScoreBounds() {
      return {
        x:
          this.x -
          2 * this.maxScoreUnits * DistanceMeter.dimensions.WIDTH -
          DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING,
        y: this.y,
        width:
          DistanceMeter.dimensions.WIDTH * (this.highScore.length + 1) +
          DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING,
        height:
          DistanceMeter.dimensions.HEIGHT +
          2 * DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING,
      };
    },
    flashHighScore() {
      const t = getTimeStamp(),
        e = t - (this.frameTimeStamp || t);
      let i = !0;
      (this.frameTimeStamp = t),
        this.flashIterations > 2 * this.config.FLASH_ITERATIONS
          ? this.cancelHighScoreFlashing()
          : ((this.flashTimer += e),
            this.flashTimer < this.config.FLASH_DURATION
              ? (i = !1)
              : this.flashTimer > 2 * this.config.FLASH_DURATION &&
                ((this.flashTimer = 0), this.flashIterations++),
            i ? this.drawHighScore() : this.clearHighScoreBounds(),
            (this.flashingRafId = requestAnimationFrame(
              this.flashHighScore.bind(this),
            )));
    },
    clearHighScoreBounds() {
      this.canvasCtx.save(),
        (this.canvasCtx.fillStyle = "#fff"),
        this.canvasCtx.rect(
          this.highScoreBounds.x,
          this.highScoreBounds.y,
          this.highScoreBounds.width,
          this.highScoreBounds.height,
        ),
        this.canvasCtx.fill(),
        this.canvasCtx.restore();
    },
    startHighScoreFlashing() {
      (this.highScoreFlashing = !0), this.flashHighScore();
    },
    isHighScoreFlashing() {
      return this.highScoreFlashing;
    },
    cancelHighScoreFlashing() {
      this.flashingRafId && cancelAnimationFrame(this.flashingRafId),
        (this.flashIterations = 0),
        (this.flashTimer = 0),
        (this.highScoreFlashing = !1),
        this.clearHighScoreBounds(),
        this.drawHighScore();
    },
    resetHighScore() {
      this.setHighScore(0), this.cancelHighScoreFlashing();
    },
    reset() {
      this.update(0, 0), (this.achievement = !1);
    },
  }),
  (Cloud.config = {
    HEIGHT: 14,
    MAX_CLOUD_GAP: 400,
    MAX_SKY_LEVEL: 30,
    MIN_CLOUD_GAP: 100,
    MIN_SKY_LEVEL: 71,
    WIDTH: 46,
  }),
  (Cloud.prototype = {
    init() {
      (this.yPos = getRandomNum(
        Cloud.config.MAX_SKY_LEVEL,
        Cloud.config.MIN_SKY_LEVEL,
      )),
        this.draw();
    },
    draw() {
      this.canvasCtx.save();
      let t = Cloud.config.WIDTH,
        e = Cloud.config.HEIGHT;
      const i = t,
        s = e;
      IS_HIDPI && ((t *= 2), (e *= 2)),
        this.canvasCtx.drawImage(
          Runner.imageSprite,
          this.spritePos.x,
          this.spritePos.y,
          t,
          e,
          this.xPos,
          this.yPos,
          i,
          s,
        ),
        this.canvasCtx.restore();
    },
    update(t) {
      this.remove ||
        ((this.xPos -= Math.ceil(t)),
        this.draw(),
        this.isVisible() || (this.remove = !0));
    },
    isVisible() {
      return this.xPos + Cloud.config.WIDTH > 0;
    },
  }),
  (BackgroundEl.config = {
    MAX_BG_ELS: 0,
    MAX_GAP: 0,
    MIN_GAP: 0,
    POS: 0,
    SPEED: 0,
    Y_POS: 0,
    MS_PER_FRAME: 0,
  }),
  (BackgroundEl.prototype = {
    init() {
      (this.spriteConfig = Runner.spriteDefinition.BACKGROUND_EL[this.type]),
        this.spriteConfig.FIXED && (this.xPos = this.spriteConfig.FIXED_X_POS),
        (this.yPos =
          BackgroundEl.config.Y_POS -
          this.spriteConfig.HEIGHT +
          this.spriteConfig.OFFSET),
        this.draw();
    },
    draw() {
      this.canvasCtx.save();
      let t = this.spriteConfig.WIDTH,
        e = this.spriteConfig.HEIGHT,
        i = this.spriteConfig.X_POS;
      const s = t,
        n = e;
      IS_HIDPI && ((t *= 2), (e *= 2), (i *= 2)),
        this.canvasCtx.drawImage(
          Runner.imageSprite,
          i,
          this.spritePos.y,
          t,
          e,
          this.xPos,
          this.yPos,
          s,
          n,
        ),
        this.canvasCtx.restore();
    },
    update(t) {
      this.remove ||
        (this.spriteConfig.FIXED
          ? ((this.animTimer += t),
            this.animTimer > BackgroundEl.config.MS_PER_FRAME &&
              ((this.animTimer = 0), (this.switchFrames = !this.switchFrames)),
            this.spriteConfig.FIXED_Y_POS_1 &&
              this.spriteConfig.FIXED_Y_POS_2 &&
              (this.yPos = this.switchFrames
                ? this.spriteConfig.FIXED_Y_POS_1
                : this.spriteConfig.FIXED_Y_POS_2))
          : (this.xPos -= BackgroundEl.config.SPEED),
        this.draw(),
        this.isVisible() || (this.remove = !0));
    },
    isVisible() {
      return this.xPos + this.spriteConfig.WIDTH > 0;
    },
  }),
  (NightMode.config = {
    FADE_SPEED: 0.035,
    HEIGHT: 40,
    MOON_SPEED: 0.25,
    NUM_STARS: 2,
    STAR_SIZE: 9,
    STAR_SPEED: 0.3,
    STAR_MAX_Y: 70,
    WIDTH: 20,
  }),
  (NightMode.phases = [140, 120, 100, 60, 40, 20, 0]),
  (NightMode.prototype = {
    update(t) {
      if (
        (t &&
          0 === this.opacity &&
          (this.currentPhase++,
          this.currentPhase >= NightMode.phases.length &&
            (this.currentPhase = 0)),
        t && (this.opacity < 1 || 0 === this.opacity)
          ? (this.opacity += NightMode.config.FADE_SPEED)
          : this.opacity > 0 && (this.opacity -= NightMode.config.FADE_SPEED),
        this.opacity > 0)
      ) {
        if (
          ((this.xPos = this.updateXPos(
            this.xPos,
            NightMode.config.MOON_SPEED,
          )),
          this.drawStars)
        )
          for (let t = 0; t < NightMode.config.NUM_STARS; t++)
            this.stars[t].x = this.updateXPos(
              this.stars[t].x,
              NightMode.config.STAR_SPEED,
            );
        this.draw();
      } else (this.opacity = 0), this.placeStars();
      this.drawStars = !0;
    },
    updateXPos(t, e) {
      return (
        t < -NightMode.config.WIDTH ? (t = this.containerWidth) : (t -= e), t
      );
    },
    draw() {
      let t =
          3 === this.currentPhase
            ? 2 * NightMode.config.WIDTH
            : NightMode.config.WIDTH,
        e = NightMode.config.HEIGHT,
        i = this.spritePos.x + NightMode.phases[this.currentPhase];
      const s = t;
      let n = NightMode.config.STAR_SIZE,
        a = Runner.spriteDefinitionByType.original.LDPI.STAR.x;
      if (
        (IS_HIDPI &&
          ((t *= 2),
          (e *= 2),
          (i = this.spritePos.x + 2 * NightMode.phases[this.currentPhase]),
          (n *= 2),
          (a = Runner.spriteDefinitionByType.original.HDPI.STAR.x)),
        this.canvasCtx.save(),
        (this.canvasCtx.globalAlpha = this.opacity),
        this.drawStars)
      )
        for (let t = 0; t < NightMode.config.NUM_STARS; t++)
          this.canvasCtx.drawImage(
            Runner.origImageSprite,
            a,
            this.stars[t].sourceY,
            n,
            n,
            Math.round(this.stars[t].x),
            this.stars[t].y,
            NightMode.config.STAR_SIZE,
            NightMode.config.STAR_SIZE,
          );
      this.canvasCtx.drawImage(
        Runner.origImageSprite,
        i,
        this.spritePos.y,
        t,
        e,
        Math.round(this.xPos),
        this.yPos,
        s,
        NightMode.config.HEIGHT,
      ),
        (this.canvasCtx.globalAlpha = 1),
        this.canvasCtx.restore();
    },
    placeStars() {
      const t = Math.round(this.containerWidth / NightMode.config.NUM_STARS);
      for (let e = 0; e < NightMode.config.NUM_STARS; e++)
        (this.stars[e] = {}),
          (this.stars[e].x = getRandomNum(t * e, t * (e + 1))),
          (this.stars[e].y = getRandomNum(0, NightMode.config.STAR_MAX_Y)),
          (this.stars[e].sourceY = IS_HIDPI
            ? Runner.spriteDefinitionByType.original.HDPI.STAR.y +
              2 * NightMode.config.STAR_SIZE * e
            : Runner.spriteDefinitionByType.original.LDPI.STAR.y +
              NightMode.config.STAR_SIZE * e);
    },
    reset() {
      (this.currentPhase = 0), (this.opacity = 0), this.update(!1);
    },
  }),
  (HorizonLine.dimensions = { WIDTH: 600, HEIGHT: 12, YPOS: 127 }),
  (HorizonLine.prototype = {
    setSourceDimensions(t) {
      for (const e in t)
        "SOURCE_X" !== e &&
          "SOURCE_Y" !== e &&
          (IS_HIDPI
            ? "YPOS" !== e && (this.sourceDimensions[e] = 2 * t[e])
            : (this.sourceDimensions[e] = t[e]),
          (this.dimensions[e] = t[e]));
      (this.xPos = [0, t.WIDTH]), (this.yPos = t.YPOS);
    },
    getRandomType() {
      return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
    },
    draw() {
      this.canvasCtx.drawImage(
        Runner.imageSprite,
        this.sourceXPos[0],
        this.spritePos.y,
        this.sourceDimensions.WIDTH,
        this.sourceDimensions.HEIGHT,
        this.xPos[0],
        this.yPos,
        this.dimensions.WIDTH,
        this.dimensions.HEIGHT,
      ),
        this.canvasCtx.drawImage(
          Runner.imageSprite,
          this.sourceXPos[1],
          this.spritePos.y,
          this.sourceDimensions.WIDTH,
          this.sourceDimensions.HEIGHT,
          this.xPos[1],
          this.yPos,
          this.dimensions.WIDTH,
          this.dimensions.HEIGHT,
        );
    },
    updateXPos(t, e) {
      const i = t,
        s = 0 === t ? 1 : 0;
      (this.xPos[i] -= e),
        (this.xPos[s] = this.xPos[i] + this.dimensions.WIDTH),
        this.xPos[i] <= -this.dimensions.WIDTH &&
          ((this.xPos[i] += 2 * this.dimensions.WIDTH),
          (this.xPos[s] = this.xPos[i] - this.dimensions.WIDTH),
          (this.sourceXPos[i] = this.getRandomType() + this.spritePos.x));
    },
    update(t, e) {
      const i = Math.floor(e * (FPS / 1e3) * t);
      this.xPos[0] <= 0 ? this.updateXPos(0, i) : this.updateXPos(1, i),
        this.draw();
    },
    reset() {
      (this.xPos[0] = 0), (this.xPos[1] = this.dimensions.WIDTH);
    },
  }),
  (Horizon.config = {
    BG_CLOUD_SPEED: 0.2,
    BUMPY_THRESHOLD: 0.3,
    CLOUD_FREQUENCY: 0.5,
    HORIZON_HEIGHT: 16,
    MAX_CLOUDS: 6,
  }),
  (Horizon.prototype = {
    init() {
      (Obstacle.types = Runner.spriteDefinitionByType.original.OBSTACLES),
        this.addCloud();
      for (let t = 0; t < Runner.spriteDefinition.LINES.length; t++)
        this.horizonLines.push(
          new HorizonLine(this.canvas, Runner.spriteDefinition.LINES[t]),
        );
      this.nightMode = new NightMode(
        this.canvas,
        this.spritePos.MOON,
        this.dimensions.WIDTH,
      );
    },
    adjustObstacleSpeed: function () {
      for (let t = 0; t < Obstacle.types.length; t++)
        Runner.slowDown &&
          ((Obstacle.types[t].multipleSpeed =
            Obstacle.types[t].multipleSpeed / 2),
          (Obstacle.types[t].minGap *= 1.5),
          (Obstacle.types[t].minSpeed = Obstacle.types[t].minSpeed / 2),
          "object" == typeof Obstacle.types[t].yPos &&
            ((Obstacle.types[t].yPos = Obstacle.types[t].yPos[0]),
            (Obstacle.types[t].yPosMobile = Obstacle.types[t].yPos[0])));
    },
    enableAltGameMode: function (t) {
      (this.clouds = []),
        (this.backgroundEls = []),
        (this.altGameModeActive = !0),
        (this.spritePos = t),
        (Obstacle.types = Runner.spriteDefinition.OBSTACLES),
        this.adjustObstacleSpeed(),
        (Obstacle.MAX_GAP_COEFFICIENT =
          Runner.spriteDefinition.MAX_GAP_COEFFICIENT),
        (Obstacle.MAX_OBSTACLE_LENGTH =
          Runner.spriteDefinition.MAX_OBSTACLE_LENGTH),
        (BackgroundEl.config = Runner.spriteDefinition.BACKGROUND_EL_CONFIG),
        (this.horizonLines = []);
      for (let t = 0; t < Runner.spriteDefinition.LINES.length; t++)
        this.horizonLines.push(
          new HorizonLine(this.canvas, Runner.spriteDefinition.LINES[t]),
        );
      this.reset();
    },
    update(t, e, i, s) {
      (this.runningTime += t),
        this.altGameModeActive && this.updateBackgroundEls(t, e);
      for (let i = 0; i < this.horizonLines.length; i++)
        this.horizonLines[i].update(t, e);
      (this.altGameModeActive && !Runner.spriteDefinition.HAS_CLOUDS) ||
        (this.nightMode.update(s), this.updateClouds(t, e)),
        i && this.updateObstacles(t, e);
    },
    updateBackgroundEl(t, e, i, s, n) {
      const a = e.length;
      if (a) {
        for (let i = a - 1; i >= 0; i--) e[i].update(t);
        const o = e[a - 1];
        a < i &&
          this.dimensions.WIDTH - o.xPos > o.gap &&
          n > Math.random() &&
          s();
      } else s();
    },
    updateClouds(t, e) {
      const i = (this.cloudSpeed / 1e3) * t * e;
      this.updateBackgroundEl(
        i,
        this.clouds,
        this.config.MAX_CLOUDS,
        this.addCloud.bind(this),
        this.cloudFrequency,
      ),
        (this.clouds = this.clouds.filter((t) => !t.remove));
    },
    updateBackgroundEls(t, e) {
      this.updateBackgroundEl(
        t,
        this.backgroundEls,
        BackgroundEl.config.MAX_BG_ELS,
        this.addBackgroundEl.bind(this),
        this.cloudFrequency,
      ),
        (this.backgroundEls = this.backgroundEls.filter((t) => !t.remove));
    },
    updateObstacles(t, e) {
      const i = this.obstacles.slice(0);
      for (let s = 0; s < this.obstacles.length; s++) {
        const n = this.obstacles[s];
        n.update(t, e), n.remove && i.shift();
      }
      if (((this.obstacles = i), this.obstacles.length > 0)) {
        const t = this.obstacles[this.obstacles.length - 1];
        t &&
          !t.followingObstacleCreated &&
          t.isVisible() &&
          t.xPos + t.width + t.gap < this.dimensions.WIDTH &&
          (this.addNewObstacle(e), (t.followingObstacleCreated = !0));
      } else this.addNewObstacle(e);
    },
    removeFirstObstacle() {
      this.obstacles.shift();
    },
    addNewObstacle(t) {
      const e =
          (Runner.isAltGameModeEnabled() && !this.altGameModeActive) ||
          this.altGameModeActive
            ? Obstacle.types.length - 1
            : Obstacle.types.length - 2,
        i = e > 0 ? getRandomNum(0, e) : 0,
        s = Obstacle.types[i];
      if ((e > 0 && this.duplicateObstacleCheck(s.type)) || t < s.minSpeed)
        this.addNewObstacle(t);
      else {
        const e = this.spritePos[s.type];
        this.obstacles.push(
          new Obstacle(
            this.canvasCtx,
            s,
            e,
            this.dimensions,
            this.gapCoefficient,
            t,
            s.width,
            this.altGameModeActive,
          ),
        ),
          this.obstacleHistory.unshift(s.type),
          this.obstacleHistory.length > 1 &&
            this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
      }
    },
    duplicateObstacleCheck(t) {
      let e = 0;
      for (let i = 0; i < this.obstacleHistory.length; i++)
        e = this.obstacleHistory[i] === t ? e + 1 : 0;
      return e >= Runner.config.MAX_OBSTACLE_DUPLICATION;
    },
    reset() {
      this.obstacles = [];
      for (let t = 0; t < this.horizonLines.length; t++)
        this.horizonLines[t].reset();
      this.nightMode.reset();
    },
    resize(t, e) {
      (this.canvas.width = t), (this.canvas.height = e);
    },
    addCloud() {
      this.clouds.push(
        new Cloud(this.canvas, this.spritePos.CLOUD, this.dimensions.WIDTH),
      );
    },
    addBackgroundEl() {
      const t = Object.keys(Runner.spriteDefinition.BACKGROUND_EL);
      if (t.length > 0) {
        let e = getRandomNum(0, t.length - 1),
          i = t[e];
        for (; i == this.lastEl && t.length > 1; )
          i = t[(e = getRandomNum(0, t.length - 1))];
        (this.lastEl = i),
          this.backgroundEls.push(
            new BackgroundEl(
              this.canvas,
              this.spritePos.BACKGROUND_EL,
              this.dimensions.WIDTH,
              i,
            ),
          );
      }
    },
  });
