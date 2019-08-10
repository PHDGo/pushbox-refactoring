;(function(){
	const sin45 = Math.sin(45 * Math.PI / 180);
	var botCtx = null,
		stageCtx = null,
		topCtx = null,
		animationLoop = null,
		snakeChestPos = null,
		statueChestPos = null,
		tombChestPos = null,
		chestList = null,
		beingList = null,
		curLevel = null,
		lastStatus = null,
		running = false,
		musicOn = true,
		pause = false,
		canPullBack = false,
		needPanning = true,
		needFleshUI = true,
		fog = false,
		levelComplish = false,
		canvasW = 0,
		canvasH = 0,
		levelN = 0,
		tileSize = 32,
		imgGridWidth = 30,
		animationTimeOut = 100,
		rectTile = [352, 288],
		chestImgPositions = [[0, 64], [160, 64], [320, 64]],
		UIImgPos = [704, 64];

	var game = {
		botCanvas: document.getElementById('bot-canvas'),
		stageCanvas: document.getElementById('stage-canvas'),
		topCanvas: document.getElementById('top-canvas'),

		setup: function() {
			botCtx = this.botCanvas.getContext('2d');
			stageCtx = this.stageCanvas.getContext('2d');
			topCtx = this.topCanvas.getContext('2d');

			canvasW = this.botCanvas.width;
			canvasH = this.botCanvas.height;

			this.init();
		},

		init: function() {
			loader.init();
			Level.init();
			Fog.init();
			unit.init();
			Shader.init();
			UI.init();
			Map.init();
			ctrl.init();
		},

		animate: function() {
			unit.animate();
			Shader.switchShadersAlpha();
			if (fog) {
				Fog.animate();
			}
			if (!levelComplish) {
				game.checkComplish();
			};
			game.lastAnimationTime = Date.now();
		},

		draw: function() {
			game.lastDrawTime = Date.now();
			if (game.lastAnimationTime) {
				game.drawingInterpolationFactor = 1 - (game.lastDrawTime - game.lastAnimationTime) / animationTimeOut;
				if (game.drawingInterpolationFactor < 0) {
					game.drawingInterpolationFactor = 0;
				};
			};

			clearCanvas(stageCtx);
			if (needPanning) {
				clearCanvas(botCtx);
				fillContext();
				Level.computeBlock();
				Level.draw();
			};

			unit.draw();
			Shader.drawShaders();
			if (fog) {
				Fog.draw();
			};

			if (needFleshUI) {
				clearCanvas(topCtx);
				UI.draw();
			};

			if (running) {
				game.animationFrame = requestAnimationFrame(game.draw);
			}
		},

		start: function(ev) {
			// game.topCanvas.focus();

			// if (game.musicOn) {
			// 	game.bgm.currentTime = 0;
			// 	game.bgm.play();
			// }
			// gameStart = true;
			running = true;
			var triggers = curLevel.triggers;
			if (triggers.length !== 0) {
				triggers.forEach(function(trigger){
					// console.log(this); // window
					initTrigger(trigger, curLevel.triggers);
				});
			}
			game.animate();
			animationLoop = setInterval(game.animate, animationTimeOut);

			Level.computeBlock(); // must after unit.init()
			Level.yeildMapImg(); // must after loader.init()
			UI.draw();
			game.draw();
		}
	};

	var ButtonElement = function(oProp) {
		this.type = 'button';
		this.on = oProp.on || false;
		this.name = oProp.name;
		this.imgX = oProp.imgX;
		this.imgY = oProp.imgY;
		this.canvasX = oProp.canvasX;
		this.canvasY = oProp.canvasY;
		this.width = oProp.width;
		this.height = oProp.height;
	};

	ButtonElement.prototype = {
		draw: function() {
			var width = this.width,
				height = this.height;
			topCtx.drawImage(game.sprite, this.imgX, this.imgY, width, height, this.canvasX, this.canvasY, width, height);
		},

		switchImgTo: function(status) {
			switch (status) {
				case 'selected':
					this.imgY = 96;
					break;
				case 'unselected':
					this.imgY = 64;
					break;
			}
			needFleshUI = true;
		},

		toogle: function() {
			this.imgY = this.on ? 64 : 96;
			this.on = this.on ? false: true;
			needFleshUI = true;
		}
	};

	var UI = {
		show: true,
		selectedButton: null,
		buttonList: [], // for checking if mouseover
		UIList: [], // for drawing
		mouse: {},
		init: function() {
			this.mapButton = new ButtonElement({name: 'map', imgX: 704, imgY: 64, canvasX: canvasW - 128, canvasY: 0, width: 32, height: 32});
			this.pullBackButton = new ButtonElement({name: 'pullBack', imgX: 736, imgY: 64, canvasX: canvasW - 96, canvasY: 0, width: 32, height: 32});
			this.resumeButton = new ButtonElement({name: 'resume', imgX: 768, imgY: 64, canvasX: canvasW - 64, canvasY: 0, width: 32, height: 32});
			this.musicButton = new ButtonElement({name: 'music', imgX: 800, imgY: 96, canvasX: canvasW - 32, canvasY: 0, width: 32, height: 32, on: true});
			this.initButtonList();
			this.initUIList();
			addEvent(game.topCanvas, 'mousemove', this.onMouseMove);
			addEvent(game.topCanvas, 'mousedown', this.onMouseDown);
		},

		initButtonList: function() {
			this.buttonList = [];
			this.buttonList.push(this.mapButton);
			this.buttonList.push(this.pullBackButton);
			this.buttonList.push(this.resumeButton);
			this.buttonList.push(this.musicButton);
		},
		initUIList: function() {
			this.UIList = [];
			this.UIList.push(this.mapButton);
			this.UIList.push(this.pullBackButton);
			this.UIList.push(this.resumeButton);
			this.UIList.push(this.musicButton);
		},

		draw: function() {
			var UIList = this.UIList;
			for (var elem of UIList) {
				elem.draw();
			};
			needFleshUI = false;
		},

		showUI: function() {
			this.initButtonList();
			this.initUIList();
			this.show = true;
			needFleshUI = true;
		},

		hideUI: function() {
			this.UIList = [];
			this.buttonList = [];
			this.show = false;
			needFleshUI = true;
		},

		onMouseMove: function(e) {
			if (Map.top) {
				return;
			}
			var topCanvas = game.topCanvas,
				mouse = UI.mouse,
				selectedButton = UI.selectedButton,
				offset = game.topCanvas.getBoundingClientRect(),
				x,
				y;
			e = e || window.event;
			x = e.pageX || event.clientX + window.pageXOffset;
			y = e.pageY || event.clientY + window.pageYOffset;
			x -= offset.left;
			y -= offset.top
			mouse.X = x;
			mouse.Y = y;
			if (selectedButton && !UI.checkMouseOver(selectedButton)) {
				if (selectedButton.name !== 'music') {
					selectedButton.switchImgTo('unselected');
				}
				selectedButton = null;
			}
		},

		onMouseDown: function() {
			if (!UI.show) {
				return;
			}
			if (Map.top) {
				Map.top = false;
				UI.UIList.pop();
				needFleshUI = true;
				return;
			}
			var buttonList = UI.buttonList;
			for (var elem of buttonList) {
				if (UI.checkMouseOver(elem)) {
					UI.selectedButton = elem;
					if (elem.name !== 'music') {
						elem.switchImgTo('selected');
					} else {
						elem.toogle();
					};
					addEvent(game.topCanvas, 'mouseup', UI.onMouseUp);
				};
			};
		},

		onMouseUp: function() {
			var buttonList = UI.buttonList,
				selectedButton = UI.selectedButton;
			for (var elem of buttonList) {
				if (UI.checkMouseOver(elem)) {
					switch (elem.name) {
						case 'map':
							Map.top = true;
							UI.UIList.push(Map);
							needFleshUI = true;
							break;
						case 'pullBack':
							pullBack();
							break;
						case 'resume':
							game.switchTimeout = setTimeout(function(){switchLevel(levelN);}, 1000);
							break;
						case 'music':
							break;
					};
				};
			};
			if (selectedButton && selectedButton.name !== 'music') {
				selectedButton.switchImgTo('unselected');
				selectedButton = null;
			}
			removeEvent(game.topCanvas, 'mouseup', UI.onMouseUp);
		},

		checkMouseOver: function(elem) {
			var mouse = UI.mouse;
			if (mouse.X >= elem.canvasX && mouse.X <= elem.canvasX + elem.width && mouse.Y >= elem.canvasY && mouse.Y <= elem.canvasY + elem.height) {
				return true;
			};
		},
	};

	var Map = {
		top: false,
		snakePic: [640, 96],
		statuePic: [608, 96],
		tombPic: [672, 96],
		token: {
			'lv1': {
				found: false,
				finish: false
			},
			'lv2': {
				found: false,
				finish: false
			},
			'lv3': {
				found: false,
				finish: false
			},
			'lv4': {
				found: false,
				finish: false
			}
		},
		canvas: document.createElement('canvas'),
		init: function() {
			this.context = this.canvas.getContext('2d');
			this.context.width = 416;
			this.context.height = 384;
		},
		draw: function() {
			var token = this.token;
			topCtx.save();
			topCtx.globalAlpha = 0.6;
			topCtx.fillStyle = '#000';
			topCtx.fillRect(0, 0, canvasW, canvasH);
			topCtx.restore();
			topCtx.drawImage(game.map, 0, 0, 400, 384, 0, 0, 416, 384);
			for (var lv in token) {
				if (token[lv].found) {
					switch (lv) {
						case 'lv1':
							topCtx.drawImage(game.sprite, this.snakePic[0], this.snakePic[1], 32, 32, 197, 103, 32, 32);
							topCtx.drawImage(game.sprite, this.statuePic[0], this.statuePic[1], 32, 32, 201, 31, 32, 32);
							console.log(this);
							break;
						case 'lv2':
							topCtx.drawImage(game.sprite, this.statuePic[0], this.statuePic[1], 32, 32, 73, 214, 32, 32);
							topCtx.drawImage(game.sprite, this.snakePic[0], this.snakePic[1], 32, 32, 77, 148, 32, 32);
							break;
						case 'lv3':
							topCtx.drawImage(game.sprite, this.snakePic[0], this.snakePic[1], 32, 32, 319, 166, 32, 32);
							topCtx.drawImage(game.sprite, this.tombPic[0], this.tombPic[1], 32, 32, 321, 94 , 32, 32);
							break;
						case 'lv4':
							topCtx.drawImage(game.sprite, this.tombPic[0], this.tombPic[1], 32, 32, 221, 316, 32, 32);
							topCtx.drawImage(game.sprite, this.statuePic[0], this.statuePic[1], 32, 32, 225, 242, 32, 32);
							break;
					}
				}
				if (token[lv].finish) {
					switch (lv) {
						case 'lv1':
							topCtx.drawImage(game.map, 404, 0, 100, 100, 164, 12, 100, 100);
							break;
						case 'lv2':
							topCtx.drawImage(game.map, 404, 0, 100, 100, 34, 132, 100, 100);
							break;
						case 'lv3':
							topCtx.drawImage(game.map, 404, 0, 100, 100, 298, 84, 100, 100);
							break;
						case 'lv4':
							topCtx.drawImage(game.map, 404, 0, 100, 100, 186, 232, 100, 100);
							break;
					}
				}
			}
		}
	};

	var conversation = {
		container: document.getElementsByClassName('game-container')[0],
		chatting: false,
		from: '',
		charactors: {
			"young": {
				"name": "man",
				"actions": {
					"talk": {pos: [0, 0], width: 98, height: 158},
					"release" : {pos: [112, 0], width: 150, height: 158}
				},
			}
		},
		showChat: function(from, action, message, remain) {
			this.from = from;
			action = action || 'talk';
			this.action = this.charactors[from].actions[action];
			
			if (this.chatting) {
				this.chatBox = document.getElementsByClassName('chatBox')[0];
			} else {
				this.chatBox = document.createElement('div');
				this.chatBox.className = 'chatBox';
				this.container.appendChild(this.chatBox);
				this.chatting = true;
			}
			this.chatBox.innerHTML = message;

			if (!remain) {
				game.chatTimeout = setTimeout(function(){
					clearTimeout(game.chatTimeout);
					game.chatTimeout = null;
					conversation.chatOver();
					// conversation.container.removeChild(conversation.chatBox);
				}, 1000);
			}
			UI.hideUI();
			UI.UIList.push(conversation);
			needFleshUI = true;
		},
		draw: function() {
			var	action = this.action,
				imgPos = action.pos,
				width = action.width,
				height = action.height;
			topCtx.drawImage(game[this.from], imgPos[0], imgPos[1], width, height, 0, canvasH - height, width, height);
		},
		chatOver: function() {
			this.chatting = false;
			this.chatBox.remove();
			UI.showUI();
		}
	};

	var title = {
		container: document.getElementsByClassName('game-container')[0],
		showLoadingScreen: function() {
			var loadingScreen = document.createElement('div'),
				outerCircle = document.createElement('div'),
				innerCircle = document.createElement('div');
			loadingScreen.className = 'loadingScreen';
			loadingScreen.appendChild(outerCircle);
			loadingScreen.appendChild(innerCircle);
			container.appendChild(loadingScreen);
		},
		drawTitle: function() {

		},
	};

	var animationLibrary = {

	};

	var loader = {
		totalItemCount: 0,
		loadedItemCount: 0,
		srcList: [
			{name:'fog', url:'image/Fog', ext:'.png'},
			{name:'tileSet', url:'image/tileSet', ext:'.png'},
			{name:'sprite', url:'image/sprite', ext:'.png'},
			{name:'clickSound', url:'sound/click', ext:'.wav'},
			// {name:'bgm', url:'sound/V.A. - Toroko\'s Theme', ext:'.mp3'},
			{name:'footstepSound', url:'sound/footstep', ext:'.wav'},
			{name:'playSound', url:'sound/play', ext:'.wav'},
			{name:'map', url:'image/map', ext:'.png'},
			{name:'young', url:'image/charactor_young', ext:'.png'},
			// {name:'correctSound', url:'sound/correct', ext:'.wav'},
			// {name:'winSound', url:'sound/win', ext:'.wav'}
		],

		init: function() {
			var item;
			for (var i = 0; i < this.srcList.length; i++) {
				item = this.srcList[i];
				if (item.ext == '.png') {
					game[item.name] = this.loadImage(item.url + item.ext);
					console.log(item.name + ':'+ item.url + item.ext + '-' + this.loadedItemCount);
				} else {
					game[item.name] = this.loadAudio(item.url + item.ext);
					console.log(item.name + ':'+ item.url + item.ext + '-' + this.loadedItemCount);
				};
			};
		},

		loadImage: function(src) {
			var image = new Image();
			// showScreen('loadingScreen');
			this.totalItemCount++;
			addEvent(image, 'load', loader.itemLoaded);
			image.src = src;
			return image;
		},

		loadAudio: function(src) {			
			var audio = new Audio();
			// showScreen('loadingScreen');
			this.totalItemCount++;
			addEvent(audio, 'canplaythrough', loader.itemLoaded);
			audio.src = src;
			return audio;
		},

		itemLoaded: function(e) {
			e = e || window.event;
			target = e.target || e.srcElement;

			removeEvent(e.target, e.type, loader.itemLoaded);
			loader.loadedItemCount++;

			if (loader.loadedItemCount == loader.totalItemCount) {
				console.log(loader.loadedItemCount);
				loader.loadedItemCount = 0;
				loader.totalItemCount = 0;
				game.start();
				// hideScreen('loadingScreen');
				// showScreen('gameStartScreen');
			}
		}
	};

	var ctrl = {
		left: false,
		right: false,
		up: false,
		down: false,

		init: function() {
			addEvent(window, 'keydown', this.onKeyDown);
			addEvent(window, 'keyup', this.onKeyUp);
			addEvent(window, 'keypress', this.onKeyPress);
		},

		onKeyDown: function(e) {
			if (levelComplish || conversation.chatting) {
				ctrl.left = false;
				ctrl.up = false;
				ctrl.right = false;
				ctrl.down = false;
				return;
			}
			e = e || window.event;
			switch (e.keyCode) {
				case 37:
					ctrl.left = true;
					break;
				case 38:
					ctrl.up = true;
					break;
				case 39:
					ctrl.right = true;
					break;
				case 40:
					ctrl.down = true;
					break;
				case 90:
					game.man.speed = 16;
					break;
			};
		},

		onKeyUp: function(e) {
			e = e || window.event;
			switch (e.keyCode) {
				case 37:
					ctrl.left = false;
					break;
				case 38:
					ctrl.up = false;
					break;
				case 39:
					ctrl.right = false;
					break;
				case 40:
					ctrl.down = false;
					break;
				case 90:
					game.man.speed = 8;
					break;
			};
		},

		onKeyPress: function(e) {
			if (levelComplish) {
				return;
			}
			e = e || window.event;
			switch (e.keyCode) {
				case 120:
					if (conversation.chatting) {
						var triggers = curLevel.triggers;
						while (triggers[triggers.length - 1]) {
							if (triggers[triggers.length - 1].type == 'timed') {
								clearTrigger(triggers[triggers.length - 1], triggers);
							}
						}
						conversation.chatOver();
					} else if (levelN !== 0) { // disable pullback in level 0
						pullBack();
					}
					break;
				case 114:
					if (levelN == 0) { // disable 'R'eload in level 0
						return;
					}
					game.switchTimeout = setTimeout(function(){switchLevel(levelN);}, 1000);
					break;
			};
		}
	};

	var Level = {
		canvas: document.createElement('canvas'),
		init: function() {
			var GWidth,
				GHeight;
			curLevel = this.levels[levelN];
			GWidth = curLevel.mapGridWidth;
			GHeight = curLevel.mapGridHeight;
			this.mapGridOffsetX = curLevel.mapGridOffsetX;
			this.mapGridOffsetY = curLevel.mapGridOffsetY;
			this.width = GWidth * tileSize;
			this.height = GHeight * tileSize;
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.context = this.canvas.getContext('2d');
			this.border = {};
			if (levelN == 0) {
				fog = true;
				game.checkComplish = checkLevelHit;
			} else {
				game.checkComplish = checkAllInPlace;
			};
		},

		yeildMapImg: function() {
			var GWidth = curLevel.mapGridWidth,
				GHeight = curLevel.mapGridHeight,
				terrain = curLevel.terrain,
				tileSet = game.tileSet,
				rects = curLevel.rects,
				len = rects.length,
				rect,
				tileID,
				tileX,
				tileY;

			for (var i = 0; i < GHeight; i++) {
				for (var j = 0; j < GWidth; j++) {
					tileID = terrain[i][j];
					if (tileID !== 0) {
						tileX = (tileID - 1) % imgGridWidth;
						tileY = Math.floor((tileID - 1) / imgGridWidth);
						this.context.drawImage(tileSet, tileX * tileSize, tileY * tileSize, tileSize, tileSize, j * tileSize, i * tileSize, tileSize, tileSize);
					};
				};
			};

			for (var i = 0; i < len; i++) {
				rect = rects[i];
				tileX = rect[0] * tileSize;
				tileY = rect[1] * tileSize;
				this.context.drawImage(tileSet, rectTile[0], rectTile[1], tileSize, tileSize, tileX, tileY, tileSize, tileSize);
			};
		},

		computeBlock: function() {
			var man = game.man;
			if (ctrl.right) {
				this.mapBlockX = Math.floor((man.mapX + man.width - 1) / canvasW);
			} else {
				this.mapBlockX = Math.floor(man.mapX / canvasW);
			};
			if (ctrl.down) {
				this.mapBlockY = Math.floor((man.mapY + man.height - 1) / canvasH);
			} else {
				this.mapBlockY = Math.floor(man.mapY / canvasH);
			};
			this.border.left = this.mapBlockX * canvasW + this.mapGridOffsetX * tileSize;
			this.border.up = this.mapBlockY * canvasH + this.mapGridOffsetY * tileSize;
			this.border.right = this.border.left + canvasW - 1;
			this.border.down = this.border.up + canvasH - 1;
			console.log(this.border.left, this.border.up, this.border.right, this.border.down);
		},
		
		draw: function() {
			botCtx.drawImage(this.canvas, this.border.left, this.border.up, canvasW, canvasH, 0, 0, canvasW, canvasH);
			needPanning = false;
		},

		"levels": [
			// {
			// 	"mapName": "testRoom",
			// 	"mapGridWidth":13,
			// 	"mapGridHeight":12,
			// 	"born": {x: 4, y: 4},
			// 	"chests":[[6,4]],
			// 	"rects":[[6,6]],
			// 	"mapObstructedTerrain":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[0,3],[12,3],[0,4],[12,4],[0,5],[12,5],[0,6],[12,6],[0,7],[12,7],[0,8],[12,8],[0,9],[12,9],[0,10],[12,10],[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11]],
			// 	"terrain":[
			// 		[83,44,42,44,44,35,235,34,44,44,44,43,82],
			// 		[47,125,122,123,124,126,231,121,124,125,123,122,38],
			// 		[47,155,152,153,154,156,229,151,154,155,153,152,38],
			// 		[47,212,219,221,220,221,264,221,221,219,221,270,38],
			// 		[47,218,273,211,211,211,211,211,211,211,273,227,36],
			// 		[46,218,263,262,211,263,222,262,211,211,273,227,38],
			// 		[47,217,261,260,211,225,236,218,211,277,211,226,38],
			// 		[45,218,211,211,211,261,220,260,211,211,211,227,38],
			// 		[47,218,211,211,211,211,211,211,211,211,211,227,38],
			// 		[81,217,211,211,276,211,211,211,211,274,211,261,80],
			// 		[31,283,211,211,211,211,211,211,211,211,211,284,31],
			// 		[31,31,31,31,31,31,31,31,31,31,31,31,31]
			// 	],
			// 	"shade":{
			// 		"shade0":{
			// 			"shadeData":[[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[1,10],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11]],
			// 			"tiles":[
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,0,0,0,0,0,0,0,0,0,0,0,0],
			// 				[0,39,41,41,41,40,41,41,41,41,39,41,0],
			// 				[0,31,31,31,31,31,31,31,31,31,31,31,0],
			// 				[0,31,31,31,31,31,31,31,31,31,31,31,0]
			// 			]
			// 		}
			// 	}
			// },
			{
				"mapName": "room0",
				"mapGridWidth": 28,
				"mapGridHeight": 14,
				"mapGridOffsetX": 1,
				"mapGridOffsetY": 1,
				"born": {x: 20, y: 9},
				"chests": [[18,4],[22,4],[20,6]],
				"chestImgPos": [0, 64],
				"rects": [[20,3],[20,4]],
				"torches": [],
				"mapObstructedTerrain":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[0,1],[27,1],[0,2],[27,2],[0,3],[27,3],[0,4],[27,4],[0,5],[27,5],[0,6],[27,6],[0,7],[27,7],[0,8],[27,8],[0,9],[27,9],[0,10],[27,10],[0,11],[27,11],[0,12],[27,12],[0,13],[1,13],[2,13],[3,13],[4,13],[5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],[20,13],[21,13],[22,13],[23,13],[24,13],[25,13],[26,13],[27,13]],
				"terrain":[
					[31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31],
					[31,275,272,272,272,272,272,273,273,273,272,273,211,272,273,211,211,273,211,211,211,211,272,211,273,211,211,31],
					[31,272,272,272,273,273,273,272,272,272,272,273,273,273,211,211,273,211,211,263,222,262,211,211,211,273,211,31],
					[31,272,272,272,273,273,273,273,273,273,272,211,211,273,211,272,211,211,211,225,229,218,273,211,211,211,273,31],
					[31,272,272,273,273,272,273,273,273,273,273,211,211,273,273,273,272,211,279,226,231,218,277,272,272,272,272,31],
					[31,272,272,273,273,211,273,211,273,273,273,211,211,273,272,272,211,272,211,261,220,260,273,211,273,273,275,31],
					[31,272,272,272,273,273,273,211,273,272,273,211,211,273,211,211,277,272,273,211,279,272,272,272,273,272,273,31],
					[31,272,211,272,273,273,273,273,273,272,273,211,211,273,273,273,272,272,272,272,272,272,272,273,272,273,273,31],
					[31,272,273,273,274,273,273,211,273,273,273,211,273,273,272,211,272,272,272,272,273,274,273,263,262,211,272,31],
					[31,272,273,211,272,211,272,273,273,272,273,211,273,272,273,272,273,272,273,272,273,272,272,261,260,273,272,31],
					[31,211,273,273,272,211,211,211,272,273,273,273,273,272,273,272,272,273,273,273,272,272,272,273,272,272,272,31],
					[31,272,272,273,273,272,272,272,272,273,273,273,273,272,211,274,272,273,273,272,273,273,211,274,272,273,273,31],
					[31,272,272,272,273,273,273,272,273,272,272,273,211,273,272,272,273,272,273,272,273,272,272,273,273,272,272,31],
					[31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31]
				],
				"shade":{},
				"weather": 'fog',
				"triggers": [
					{
						"type": 'timed', "time": 1000, disposable: true,// "disposable" means it plays only one time.
						"action": function() {
							conversation.showChat('young', 'talk', '<p>......\u8fdb\u6765\u4e86\u3002</p>', true);
						}
					},
					{
						"type": "timed", "time": 2000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u8def\u4e0a\u7684\u5947\u602a\u96d5\u50cf\u4ea7\u751f\u7684\u5e7b\u5883\u3002</p>', true);
						}
					},
					{
						"type": "timed", "time": 3500, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u53ea\u8981\u628a\u5b83\u4eec\u6d88\u9664\uff0c\u4eca\u5929\u7684\u996d\u94b1\u5c31\u6709\u7740\u843d\u5566\uff01</p>', true);
						}
					},
					{
						"type": "timed", "time": 5000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>......</p>', true);
						}
					},
					{
						"type": "timed", "time": 6000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u8bdd\u8bf4\uff0c\u6700\u8fd1\u5c0f\u9547\u56db\u5468\u51fa\u73b0\u7684\u8fd9\u4e9b\u96d5\u50cf\uff0c\u6bcf\u5929\u6570\u91cf\u4f3c\u4e4e\u662f\u4e00\u5b9a\u7684\u3002</p>', true);
						}
					},
					{
						"type": "timed", "time": 9000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u5b83\u4eec\u4ea7\u751f\u7684\u5e7b\u5883\u867d\u4e0d\u81f3\u4e8e\u5371\u6025\u5c45\u6c11\u7684\u5b89\u5168\uff0c\u4f46\u7ecf\u5e38\u628a\u65e9\u6668\u5916\u51fa\u7684\u5546\u4eba\u7ed9\u56f0\u4f4f\uff0c\u56e0\u6b64\u5236\u9020\u4e86\u4e0d\u5c0f\u7684\u9ebb\u70e6\u3002</p>', true);
						}
					},
					{
						"type": "timed", "time": 12000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u8fd9\u4e9b\u96d5\u50cf\u4f55\u65f6\u624d\u80fd\u5b8c\u5168\u6d88\u5931\u5462......</p>', true);
						}
					},
					{
						"type": "timed", "time": 14000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'talk', '<p>\u5230\u90a3\u5929\u53c8\u5f97\u91cd\u65b0\u627e\u4e8b\u505a\u4e86\u3002\u5148\u89e3\u51b3\u6389\u8fd9\u51e0\u4e2a\u5427\u3002</p>', true);
						}
					},
					{
						"type": "timed", "time": 17000, disposable: true,
						"action": function() {
							conversation.showChat('young', 'release', '<p>\uff08...\u91ca\u653e\u4fe1\u4f7f...\uff09</p>', false);
							game.man.processOrder('play', {});
						}
					}
				]
			},
			{
				"mapName": "room1",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"mapGridOffsetX": 0,
				"mapGridOffsetY": 0,
				"born": {x: 10, y: 6},
				"chests":[[4,6],[9,6],[4,7],[8,7],[9,7],[9,8]],
				"chestImgPos": [0, 64],
				"rects":[[6,6],[7,6],[6,7],[7,7],[6,8],[7,8]],
				"torches":[[5,3],[9,4]],
				"mapObstructedTerrain":[[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[2,5],[7,5],[8,5],[9,5],[10,5],[11,5],[2,6],[11,6],[2,7],[3,7],[11,7],[3,8],[11,8],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,83,44,44,44,44,82,0,0,0,0,0],
					[0,0,47,124,125,123,122,34,44,44,44,82,0],
					[0,0,45,154,155,153,152,121,124,125,122,38,0],
					[0,0,31,211,211,211,211,151,154,155,152,38,0],
					[0,0,31,283,211,211,211,211,211,211,211,38,0],
					[0,0,31,31,211,211,211,211,211,211,211,31,0],
					[0,0,0,31,283,211,211,211,211,211,284,31,0],
					[0,0,0,31,31,31,31,31,31,31,31,31,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0]
				],
				"shade":{
					"shade0":{
						"shadeData":[[2,2],[2,5],[3,5],[3,6],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,81,33,0,0,0,0,0,0,0,0,0],
							[0,0,0,47,0,0,0,0,0,0,0,0,0],
							[0,0,0,81,41,41,41,41,41,41,41,80,0],
							[0,0,0,0,31,31,31,31,31,31,31,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0]
						]
					},
				},
				"weather": '',
				"triggers": ''
			},
			{
				"mapName": "room2",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"mapGridOffsetX": 0,
				"mapGridOffsetY": 0,
				"born": {x: 11, y: 5},
				"chests":[[10,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[10,6],[10,7]],
				"chestImgPos": [160, 64],
				"rects":[[6,5],[7,5],[8,5],[6,6],[7,6],[8,6],[6,7],[7,7],[8,7]],
				"torches":[[4,3],[9,3]],
				"mapObstructedTerrain":[[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[1,5],[12,5],[1,6],[12,6],[1,7],[12,7],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,83,44,44,44,44,44,44,44,44,44,43,82],
					[0,47,125,122,123,125,122,125,122,123,124,125,38],
					[0,47,155,152,153,155,152,155,152,153,154,155,38],
					[0,47,271,219,221,219,219,221,219,219,220,270,38],
					[0,31,216,211,211,211,211,211,211,211,211,227,31],
					[0,31,283,263,224,262,224,224,224,211,224,284,31],
					[0,31,31,31,31,31,31,31,31,31,31,31,31],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0]
				],
				"shade":{
					"shade0":{
						"shadeData":[[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,81,41,41,41,41,41,41,41,41,41,41,80],
							[0,0,31,31,31,31,31,31,31,31,31,31,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0]
						]
					},
				},
				"weather": '',
				"triggers": ''
			},
			{
				"mapName": "room3",
				"mapGridWidth": 13,
				"mapGridHeight": 12,
				"mapGridOffsetX": 0,
				"mapGridOffsetY": 0,
				"born": {x: 7, y: 6},
				"chests":[[6,5],[7,5],[8,5],[6,6],[8,6],[6,7],[7,7],[8,7]],
				"chestImgPos": [0, 64],
				"rects":[[5,4],[7,4],[9,4],[5,6],[9,6],[5,8],[7,8],[9,8]],
				"torches": [[7,2]],
				"mapObstructedTerrain":[[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[4,4],[10,4],[4,5],[10,5],[4,6],[10,6],[4,7],[10,7],[4,8],[10,8],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,83,44,44,44,44,43,82,0,0],
					[0,0,0,0,47,126,128,127,129,123,38,0,0],
					[0,0,0,0,47,156,158,157,159,153,38,0,0],
					[0,0,0,0,47,236,229,236,229,236,38,0,0],
					[0,0,0,0,47,228,256,221,255,230,36,0,0],
					[0,0,0,0,46,236,218,211,227,236,38,0,0],
					[0,0,0,0,81,228,258,224,257,230,80,0,0],
					[0,0,0,0,31,236,231,236,231,236,31,0,0],
					[0,0,0,0,31,31,31,31,31,31,31,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0]
				],
				"shade":{
					"shade0":{
						"shadeData":[[5,7],[6,7],[7,7],[8,7],[9,7],[5,8],[6,8],[7,8],[8,8],[9,8]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,41,41,41,41,41,0,0,0],
							[0,0,0,0,0,31,31,31,31,31,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0]
						]
					},
				},
				"weather": '',
				"triggers": ''
			},
			{
				"mapName": "room4",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"mapGridOffsetX": 0,
				"mapGridOffsetY": 0,
				"born": {x: 6, y: 4},
				"chests":[[5,5],[7,5],[4,6],[6,6],[8,6],[5,7],[7,7],[4,8],[6,8],[8,8],[5,9],[7,9]],
				"chestImgPos": [320, 64],
				"rects":[[4,6],[5,6],[6,6],[7,6],[8,6],[4,7],[8,7],[4,8],[5,8],[6,8],[7,8],[8,8]],
				"torches":[[4,3],[5,2],[7,2],[8,3]],
				"mapObstructedTerrain":[[4,1],[5,1],[6,1],[7,1],[8,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[2,4],[3,4],[4,4],[8,4],[9,4],[10,4],[2,5],[10,5],[2,6],[10,6],[2,7],[10,7],[2,8],[10,8],[2,9],[10,9],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[10,10],[7,11],[8,11],[9,11],[10,11]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,83,44,44,44,82,0,0,0,0],
					[0,0,83,44,35,122,123,124,34,44,82,0,0],
					[0,0,47,125,126,152,153,154,121,125,38,0,0],
					[0,0,45,155,156,271,219,221,151,155,38,0,0],
					[0,0,47,212,221,260,211,211,211,211,38,0,0],
					[0,0,45,260,211,211,211,211,211,211,38,0,0],
					[0,0,47,211,211,211,211,211,211,211,38,0,0],
					[0,0,31,211,211,211,211,211,211,211,38,0,0],
					[0,0,31,283,211,211,211,211,211,211,31,0,0],
					[0,0,31,31,31,31,31,31,283,284,31,0,0],
					[0,0,0,0,0,0,0,31,31,31,31,0,0]
				],
				"shade":{
					"shade0":{
						"shadeData":[[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[8,10],[9,10]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,81,41,41,41,41,33,0,0,0,0,0],
							[0,0,0,31,31,31,31,81,41,41,80,0,0],
							[0,0,0,0,0,0,0,0,31,31,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0]
						]
					},
				},
				"weather": '',
				"triggers": ''
			}
		]
	};

	var Fog = {
		init: function() {
			if (curLevel.weather == 'fog') {
				fog = true;
				this.X = 0;
				this.vx = -1;
			};
		},

		animate: function() {
			this.X += this.vx;
			if (this.X < -canvasW) {
				this.X = 0;
			}
		},

		draw: function() {
			stageCtx.save();
			stageCtx.globalAlpha = 0.2;
			stageCtx.drawImage(game.fog, this.X, 0, canvasW, canvasH);
			stageCtx.drawImage(game.fog, this.X + canvasW, 0, canvasW, canvasH);
			stageCtx.restore();
		}
	};

	var Shader = {
		shadeList: [],
		init: function() {
			this.shadeList = [];
			var shades = curLevel.shade;
			for (var shadeName in shades) {
				this.shadeList.push({name: shadeName, tiles: shades[shadeName].tiles, alpha: 1});
			};
		},

		switchShadersAlpha: function() {
			var shadeList = this.shadeList,
				man = game.man;
			for (var shade of shadeList) {
				if (shade.name == man.inShade) {
					shade.alpha = 0.6;
				} else {
					shade.alpha = 1;
				};
			};
		},

		drawShaders: function() {
			var	shadeList = this.shadeList,
				GWidth = curLevel.mapGridWidth,
				GHeight = curLevel.mapGridHeight,
				tileSet = game.tileSet,
				tileID,
				tileX,
				tileY;
			for (var shade of shadeList) {
				stageCtx.save();
				stageCtx.globalAlpha = shade.alpha;
				var tiles = shade.tiles;
				for (var i = 0; i < GHeight; i++) {
					for (var j = 0; j < GWidth; j++) {
						tileID = tiles[i][j];
						if (tileID !== 0) {
							tileX = (tileID - 1) % imgGridWidth;
							tileY = Math.floor((tileID - 1) / imgGridWidth);
							stageCtx.drawImage(tileSet, tileX * tileSize, tileY * tileSize, tileSize, tileSize, j * tileSize, i * tileSize, tileSize, tileSize);
						};
					};
				};
				stageCtx.restore();
			};
		}
	};

	var unit = {
		init: function() {
			var torches = curLevel.torches,
				chests = curLevel.chests,
				chestslen = chests.length,
				mapName = curLevel.mapName,
				id = 1,
				mapGridCoor,
				chestImgPos,
				torch,
				chest,
				man,
				oItem;
			chestList = [];
			beingList = [];
			lastStatus = {};

			for (var mapGridCoor of torches) {
				oItem = {mapX: mapGridCoor[0] * tileSize, mapY: mapGridCoor[1] * tileSize};
				torch = Object.assign(oItem, Torch);
				beingList.push(torch);
			};

			chestImgPos = curLevel.chestImgPos;
			for (var i = 0; i < chestslen; i++) {
				mapGridCoor = chests[i];
				if (mapName == "room0") {
					chestImgPos = chestImgPositions[i];
				};
				oItem = {type: "chest", id: id++, box: Chest.box, imgPos: chestImgPos, gridWidth: 1, gridHeight: 2, mapGridX: mapGridCoor[0], mapGridY: mapGridCoor[1], actions: Chest.rawActions, speed: 0};
				chest = new boxObj(oItem);
				Object.assign(chest, commonFunc, Chest);
				chest.init();
				chestList.push(chest);
				beingList.push(chest);
			};

			man = new boxObj({
					type: "human",
					id: 0,
					box: Role.box,
					imgPos: [0, 0],
					gridWidth: 2,
					gridHeight: 2,
					mapGridX: curLevel.born.x,
					mapGridY: curLevel.born.y,
					actions: Role.rawActions,
					speed: 8,
				});
			Object.assign(man, commonFunc, Role);
			man.init();
			beingList.push(man);
			game.man = man;
		},

		animate: function() {
			var len = beingList.length;
			for (var i = 0; i < len; i++) {
				beingList[i].animate();
			};
		},

		draw: function() {
			var sortedBeingList = Object.assign([], beingList);
			sortedBeingList.sort(function(a, b){
				return a.mapY - b.mapY;
			});
			sortedBeingList.forEach(function(being){
				being.draw();
			});
		}
	};

	var boxObj = function(oProp) {
		var actions = oProp.actions,
			startIndex = 0,
			rawActions,
			name,
			frame,
			box = oProp.box,
			options = {
				type: "",
				id: 0,
				box: {},
				imgPos: [],
				gridWidth: 0,
				gridHeight: 0,
				mapGridX: 0,
				mapGridY: 0,
				actions: {},
				speed: 0
			};
		for (var option in options) {
			if (!oProp.hasOwnProperty(option)) {
				console.log(new Error('Oops! Something fuck up'));
				return;
			};
		};

		this.actions = {};
		rawActions = oProp.actions;
		for (var rawAction of rawActions) {
			name = rawAction['name'];
			frame = rawAction['frame'];
			this.actions[name] = {name: name, startIndex: startIndex, frame: frame};
			startIndex += frame;
		};

		switch (oProp.type) {
			case 'human':
				offsetX = 16;
				offsetY = 36;
				break;
			case 'chest':
				offsetX = 0;
				offsetY = 32;
				break;
		};

		this.type = oProp.type;
		this.id = oProp.id;
		this.frameWidth = oProp.gridWidth * tileSize;
		this.frameHeight = oProp.gridHeight * tileSize;

		this.mapGridX = oProp.mapGridX;
		this.mapGridY = oProp.mapGridY;
		this.pixelOffsetX = offsetX + box['marginLeft'];
		this.pixelOffsetY = offsetY + box['marginUp'];
		this.mapX = this.mapGridX * tileSize + box['marginLeft'];
		this.mapY = this.mapGridY * tileSize + box['marginUp'];
		this.lastMapX = this.mapX;
		this.lastMapY = this.mapY;
		this.prePosition = {mapGridX: this.mapGridX, mapGridY: this.mapGridY};
		this.width = tileSize - box.marginLeft - box.marginRight;
		this.height = tileSize - box.marginUp - box.marginDown;

		this.dir = '';
		this.speed = oProp.speed;
		this.lastMovementX = 0;
		this.lastMovementY = 0;
		this.curFrameIndex = 0;
		this.animFrame = 0;
		this.imgPos = oProp.imgPos;
	};

	var commonFunc = {
		draw: function(){
			var border = Level.border,
				frameWidth = this.frameWidth,
				frameHeight = this.frameHeight,
				imgPos = this.imgPos,
				drawingInterpolationFactor = game.drawingInterpolationFactor,
				spritePos = [imgPos[0] + this.curFrameIndex * frameWidth, imgPos[1]];
			this.canvasX = this.mapX - this.pixelOffsetX - border.left - drawingInterpolationFactor * this.lastMovementX;
			this.canvasY = this.mapY - this.pixelOffsetY - border.up - drawingInterpolationFactor * this.lastMovementY;

			if (this.type == 'human') {
				this.drawShadow(this.canvasX + 32, this.canvasY + 64, 10, 3);
			}
			stageCtx.drawImage(game.sprite,  spritePos[0], spritePos[1], frameWidth, frameHeight, this.canvasX, this.canvasY, frameWidth, frameHeight);
		},

		intersects: function(rectObj) {
			return !(this.mapX + this.width <= rectObj.mapX ||
					 rectObj.mapX + rectObj.width <= this.mapX ||
					 this.mapY + this.height <= rectObj.mapY ||
					 rectObj.mapY + rectObj.height <= this.mapY
					);
		},

		intersectWithWall: function() {
			var obstructions = curLevel.mapObstructedTerrain,
				len = obstructions.length;
			for (var i = 0; i < len; i++) {
				var obs = obstructions[i],
					grid = {
						mapX: obs[0] * tileSize,
						mapY: obs[1] * tileSize,
						width: tileSize,
						height: tileSize
					};
				if (this.intersects(grid)) {
					return grid;
				}
			}
		},

		intersectWithChest: function() {
			var interChestList = [];
			for (var chest of chestList) {
				if (this.intersects(chest) && (this !== chest)) {
					interChestList.push(chest);
				};
			};
			return interChestList;
		},
	}

	var Role = {
		faceTo: 'R',
		rawActions: [
			{name: "standR", frame: 10},
			{name: "standL", frame: 10},
			{name: "playR", frame: 9},
			{name: "playL", frame: 9},
			{name: "walkR", frame: 5},
			{name: "walkL", frame: 5}
		],

		box: {
			marginLeft: 3,
			marginRight: 3,
			marginUp: 20,
			marginDown: 0
		},

		init: function() {
			var box = this.box;
			this.oAct = this.actions['standR'];
			this.nextAct = 'standR';
			this.faceTo = 'R';
			this.processOrder('stand', {});
		},

		detectInShade: function() {
			var shades = curLevel.shade,
				man = game.man;

			for (var shadeName in shades) {
				var data = shades[shadeName].shadeData,
					len = data.length;
				for (var i = 0; i < len; i++) {
					var shadeGrid = data[i],
						grid = {
							mapX: shadeGrid[0] * tileSize,
							mapY: shadeGrid[1] * tileSize,
							box: {
								left: 0,
								right: 0,
								up: 0,
								down: 0
							}
						};
					if (this.intersects(grid)) {
						return shadeName;
					};
				};
			};
			return null;
		},

		animate: function() {
			this.alterFrame();
			this.calculateCoor();
			this.inShade = this.detectInShade();
		},

		processOrder:function(order, details) {
			var startIndex,
				nextAct,
				oAct;
			switch (order) {
				case 'pushBox':
					details.interObj.processOrder('move', details);
					break;
				case 'stand':
					if (details.faceTo) { this.faceTo = details.faceTo }
					else { details.faceTo = this.faceTo };
					nextAct = 'stand' + details.faceTo;
					this.nextAct = nextAct;
					break;
				case 'walk':
					if (details.faceTo) { this.faceTo = details.faceTo }
					else { details.faceTo = this.faceTo };
					nextAct = 'walk' + details.faceTo;
					this.nextAct = nextAct;
					this.oAct = this.actions[nextAct];
					this.curFrameIndex = this.oAct['startIndex'];
					break;
				case 'play':
					if (details.faceTo) { this.faceTo = details.faceTo }
					else { details.faceTo = this.faceTo };
					nextAct = 'play' + details.faceTo;
					this.nextAct = nextAct;
					break;
			}
		},

		alterFrame: function() {
			var nextAct = this.nextAct,
				oAct = this.oAct,
				act = oAct.name,
				step = 1,
				startIndex;
			if (act == nextAct) {
				startIndex = oAct.startIndex;
				if (act == 'standL' || act == 'standR') { step = Math.random() > 0.5 ? 0 : 1 };
				this.curFrameIndex += step;
				if (this.curFrameIndex >= startIndex + oAct.frame) {
					if (act == 'playL' || act == 'playR') {
						this.processOrder('stand', {});
						// Last frame of play actions is out of range, amend it
						this.oAct = this.actions[nextAct];
						this.curFrameIndex = this.oAct['startIndex'];
					} else {
						this.curFrameIndex = startIndex;
					};
				};
			} else {
				this.oAct = this.actions[nextAct];
				this.curFrameIndex = this.oAct['startIndex'];
			};
		},

		calculateCoor: function() {
			var left = ctrl.left,
				right = ctrl.right,
				up = ctrl.up,
				down = ctrl.down,
				speed = this.speed,
				pushSpeed = this.pushSpeed,
				act = this.oAct.name,
				chests,
				grid,
				nOfChests,
				chest;
			// console.log(this.mapX, this.mapY);
			if (!(up || down || left || right)) { // no keyboard input
				if (act !== 'standL' && act !== 'standR') { // not standing
					if (act !== 'playL' && act !== 'playR') { // not playing
						this.processOrder('stand', {});
					};
				} else { // is standing
					if (Math.random() > 0.99) { this.processOrder('play', {}) }; // random waiting action
				};
				this.lastMovementX = 0;
				this.lastMovementY = 0;
			} else {
				this.lastMapX = this.mapX;
				this.lastMapY = this.mapY;
				if (left) {
					if (act !== 'walkL') {
						this.processOrder('walk', {faceTo: 'L'});
					};
					if (up || down) {
						speed = this.speed * sin45;
					};
					this.mapX -= speed;
					chests = this.intersectWithChest();
					grid = this.intersectWithWall();
					nOfChests = chests.length;
					if (grid) { // wall ahead
						this.mapX = grid.mapX + tileSize;
					} else if (nOfChests > 1) { // pushing more than one chest
						chest = chests[0];
						this.mapX = chest.mapX + chest.width;
					} else if (nOfChests == 1) { // pushing a chest
						chest = chests[0];
						if (this.mapX < chest.mapX + chest.width) { //move faster than the chest u r moving
							this.mapX = chest.mapX + chest.width;
						};
						this.processOrder('pushBox', {dir: 'left', interObj: chest});
					};
					if (this.mapX < Level.border.left) { // move out of canvas
						// if (this.mapX < 0) { // move out of map
						// 	this.mapX = 0;
						// };
						needPanning = true;
					};
				};
				if (right) {
					if (act !== 'walkR') {
						this.processOrder('walk', {faceTo: 'R'});
					};
					if (up || down) {
						speed = this.speed * sin45;
					};
					this.mapX += speed;
					chests = this.intersectWithChest();
					grid = this.intersectWithWall();
					nOfChests = chests.length;
					if (grid) {
						this.mapX = grid.mapX - this.width;
					} else if (nOfChests > 1) {
						var chest = chests[0];
						this.mapX = chest.mapX - this.width;
					} else if (nOfChests == 1) {
						chest = chests[0];
						if (this.mapX > chest.mapX - this.width) {
							this.mapX = chest.mapX - this.width;
						};
						this.processOrder('pushBox', {dir: 'right', interObj: chest});
					};
					if (this.mapX + this.width - 1 > Level.border.right) {
						// if (this.mapX + this.width - 1 > Level.width) {
						// 	this.mapX = -this.width + Level.width + 1;
						// };
						needPanning = true;
					};
				};
				if (up) {
					if (act !== 'walkL' && act !== 'walkR') {
						this.processOrder('walk', {});
					};
					if (left || right) {
						speed = this.speed * sin45;
					};
					this.mapY -= speed;
					chests = this.intersectWithChest();
					grid = this.intersectWithWall();
					nOfChests = chests.length;
					if (grid) {
						this.mapY = grid.mapY + tileSize;
					} else if (nOfChests > 1) {
						var chest = chests[0];
						this.mapY = chest.mapY + chest.height;
					} else if (nOfChests == 1) {
						chest = chests[0];
						if (this.mapY < chest.mapY + chest.height) {
							this.mapY = chest.mapY + chest.height;
						};
						this.processOrder('pushBox', {dir: 'up', interObj: chest});
					};
					if (this.mapY < Level.border.up) {
						// if (this.mapY < 0) {
						// 	this.mapY = 0;
						// };
						needPanning = true;
					};
				};
				if (down) {
					if (act !== 'walkL' && act !== 'walkR') {
						this.processOrder('walk', {});
					};
					if (left || right) {
						speed = this.speed * sin45;
					};
					this.mapY += speed;
					chests = this.intersectWithChest();
					grid = this.intersectWithWall();
					nOfChests = chests.length;
					if (grid) {
						this.mapY = grid.mapY - this.height;
					} else if (nOfChests > 1) {
						var chest = chests[0];
						this.mapY = chest.mapY - this.height;
					} else if (nOfChests == 1) {
						chest = chests[0];
						if (this.mapY > chest.mapY - this.height) {
							this.mapY = chest.mapY - this.height;
						};
						this.processOrder('pushBox', {dir: 'down', interObj: chest});
					};
					if (this.mapY + this.height - 1 > Level.border.down) {
						// if (this.mapY  + this.height > Level.height) {
						// 	this.mapY = -this.height + Level.height + 1;
						// };
						needPanning = true;
					};
				};
				this.lastMovementX = this.mapX - this.lastMapX;
				this.lastMovementY = this.mapY - this.lastMapY;
			};
		},

		drawShadow: function(x, y, a, b) {
			var r = (a > b) ? a : b,
				ratioX = a / r,
				ratioY = b / r,
				offset = this.faceTo == 'L' ? -1 : 1;
			stageCtx.save();
			stageCtx.scale(ratioX, ratioY);
			stageCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
			stageCtx.beginPath();
			stageCtx.arc(x / ratioX + offset, y / ratioY, r, 0, 2*Math.PI, false);
			stageCtx.closePath();
			stageCtx.fill();
			stageCtx.restore();
		}
	};

	var Chest = {
		// friction: -4,
		easing: 0.3,
		rawActions: [
			{name: "stand", frame: 1},
			{name: "inPlace", frame: 3},
			{name: "onRect", frame: 1}
		],
		box: {
			marginLeft: 0,
			marginRight: 0,
			marginUp: 8,
			marginDown: 0
		},

		init: function() {
			this.arrive = true;
			this.nextX = this.mapX;
			this.nextY = this.mapY;
			this.nextMapGridX = this.mapGridX;
			this.nextMapGridY = this.mapGridY;
			this.oAct = this.actions['stand'];
			this.nextAct = 'stand';
			this.onRect = false;
			this.updateOnRect();

			if (this.onRect) {
				this.processOrder('onRect');
			};
		},

		animate: function() {
			this.alterFrame();
			this.calculateCoor();
		},
		
		calculateCoor: function() {
			var	interGrid,
				interChest,
				interChestLen,
				nextMapGridX,
				nextMapGridY,
				vx,
				vy;
			if (this.dir) {
				this.lastMapX = this.mapX;
				this.lastMapY = this.mapY;
				switch (this.dir) {
					case 'up':
						nextMapGridY = this.mapGridY - 1;
						nextMapGridX = this.mapGridX;
						nextGrid = {mapGridX: nextMapGridX, mapGridY: nextMapGridY};
						if (this.arrive == true) {
							interGrid = wallOnGrid(nextGrid);
							interChest = chestOnGrid(nextGrid);
							if (!interGrid && !interChest) {
								this.nextMapGridY = nextMapGridY;
								this.nextY = this.nextMapGridY * tileSize + this.box.marginUp;
								this.prePosition.mapGridY = this.mapGridY;
								this.prePosition.mapGridX = this.mapGridX;
								lastStatus.chest = this;
								lastStatus.dir = 'up';
								canPullBack = true;
								this.arrive = false;
							} else {
								this.dir = '';
								break;
							};
						};
						vy = Math.abs(this.mapY - this.nextY) * this.easing;
						this.mapY -= vy;
						if (this.mapY - 2 <= this.nextY) {
							this.mapGridY = this.nextMapGridY;
							this.mapY = this.nextY;
							// if (this.mapGridY < 0) {
							// 	this.mapGridY = curLevel.mapGridHeight - 1;
							// 	this.mapY = this.mapGridY * tileSize + this.box.marginUp;
							// };
							this.arrive = true;
							this.updateOnRect();
							if (this.onRect) {
								this.processOrder('inPlace');
							} else {
								this.processOrder('stand');
							};
							this.dir = '';
						};
						break;
					case 'down':
						nextMapGridY = this.mapGridY + 1;
						nextMapGridX = this.mapGridX;
						nextGrid = {mapGridX: nextMapGridX, mapGridY: nextMapGridY};
						if (this.arrive == true) {
							interGrid = wallOnGrid(nextGrid);
							interChest = chestOnGrid(nextGrid);
							if (!interGrid && !interChest) {
								this.nextMapGridY = nextMapGridY;
								this.nextY = this.nextMapGridY * tileSize + this.box.marginUp;
								this.prePosition.mapGridY = this.mapGridY;
								this.prePosition.mapGridX = this.mapGridX;
								lastStatus.chest = this;
								lastStatus.dir = 'down';
								canPullBack = true;
								this.arrive = false;
							} else {
								this.dir = '';
								break;
							};
						};
						vy = Math.abs(this.mapY - this.nextY) * this.easing;
						this.mapY += vy;
						if (this.mapY + 2 >= this.nextY) {
							this.mapGridY = this.nextMapGridY;
							this.mapY = this.nextY;
							// if (this.mapGridY >= curLevel.mapGridHeight) {
							// 	this.mapGridY = 0;
							// 	this.mapY = this.mapGridY * tileSize + this.box.marginUp;
							// };
							this.arrive = true;
							this.updateOnRect();
							if (this.onRect) {
								this.processOrder('inPlace');
							} else {
								this.processOrder('stand');
							};
							this.dir = '';
						};
						break;
					case 'left':
						nextMapGridX = this.mapGridX - 1;
						nextMapGridY = this.mapGridY;
						nextGrid = {mapGridX: nextMapGridX, mapGridY: nextMapGridY};
						if (this.arrive == true) {
							interGrid = wallOnGrid(nextGrid);
							interChest = chestOnGrid(nextGrid);
							if (!interGrid && !interChest) {
								this.nextMapGridX = nextMapGridX;
								this.nextX = this.nextMapGridX * tileSize + this.box.marginLeft;
								this.prePosition.mapGridX = this.mapGridX;
								this.prePosition.mapGridY = this.mapGridY;
								lastStatus.chest = this;
								lastStatus.dir = 'left';
								canPullBack = true;
								this.arrive = false;
							} else {
								this.dir = '';
								break;
							};
						};
						vx = Math.abs(this.mapX - this.nextX) * this.easing;
						this.mapX -= vx;
						if (this.mapX - 2 <= this.nextX) {
							this.mapGridX = this.nextMapGridX;
							this.mapX = this.nextX;
							// if (this.mapGridX < 0) {
							// 	this.mapGridX = curLevel.mapGridWidth - 1;
							// 	this.mapX = this.mapGridX * tileSize + this.box.marginLeft;
							// };
							this.arrive = true;
							this.updateOnRect();
							if (this.onRect) {
								this.processOrder('inPlace');
							} else {
								this.processOrder('stand');
							};
							this.dir = '';
						};
						break;
					case 'right':
						nextMapGridX = this.mapGridX + 1;
						nextMapGridY = this.mapGridY;
						nextGrid = {mapGridX: nextMapGridX, mapGridY: nextMapGridY};
						if (this.arrive == true) {
							interGrid = wallOnGrid(nextGrid);
							interChest = chestOnGrid(nextGrid);
							if (!interGrid && !interChest) {
								this.nextMapGridX = nextMapGridX;
								this.nextX = this.nextMapGridX * tileSize + this.box.marginLeft;
								this.prePosition.mapGridX = this.mapGridX;
								this.prePosition.mapGridY = this.mapGridY;
								lastStatus.chest = this;
								lastStatus.dir = 'right';
								canPullBack = true;
								this.arrive = false;
							} else {
								this.dir = '';
								break;
							};
						};
						vx = Math.abs(this.mapX - this.nextX) * this.easing;
						this.mapX += vx;
						if (this.mapX + 2 >= this.nextX) {
							this.mapGridX = this.nextMapGridX;
							this.mapX = this.nextX;
							// if (this.mapGridX >= curLevel.mapGridWidth) {
							// 	this.mapGridX = 0;
							// 	this.mapX = this.mapGridX * tileSize + this.box.marginLeft;
							// };
							this.arrive = true;
							this.updateOnRect();
							if (this.onRect) {
								this.processOrder('inPlace');
							} else {
								this.processOrder('stand');
							};
							this.dir = '';
						};
						break;
				};
				this.lastMovementX = this.mapX - this.lastMapX;
				this.lastMovementY = this.mapY - this.lastMapY;
			} else {
				this.lastMovementX = 0;
				this.lastMovementY = 0;
			};
		},

		processOrder: function(order, details) {
			var startIndex;
			switch (order) {
				case 'move':
					this.dir = details.dir;
					break;
				case 'stand':
					this.nextAct = 'stand';
					break;
				case 'inPlace':
					this.nextAct = 'inPlace';
					break;
				case 'onRect':
					this.nextAct = 'onRect';
					break;
			}
		},

		alterFrame:function() {
			var nextAct = this.nextAct,
				oAct = this.oAct,
				act = oAct.name,
				startIndex;
			if (act == nextAct) {
				startIndex = oAct.startIndex;
				this.curFrameIndex++;
				if (this.curFrameIndex >= startIndex + oAct.frame) {
					if (act == 'inPlace') {
						this.processOrder('onRect');
					} else {
						this.curFrameIndex = startIndex;
					};
				};
			} else {
				this.oAct = this.actions[nextAct];
				this.curFrameIndex = this.oAct['startIndex'];
			};
		},

		updateOnRect:function() {
			var rects = curLevel.rects;
			for (var rect of rects) {
				if (this.mapGridX == rect[0] && this.mapGridY == rect[1]) {
					this.onRect = true;
					return;
				};
			};
			this.onRect = false;
		}
	};

	var Torch = {
		frameWidth : 32,
		frameHeight : 32,
		imgPos : [480, 96],
		curFrameIndex: 0,
		pixelOffsetX: 0,
		pixelOffsetY: 0,
		lastMovementX: 0,
		lastMovementY: 0,

		animate: function() {
			var step = Math.random() > 0.5 ? 0 : 1;
			this.curFrameIndex += step;
			if (this.curFrameIndex >= 4) {
				this.curFrameIndex = 1;
			};
		},
		draw: commonFunc.draw,
	};

	var fillContext = function() {
		botCtx.rect(0, 0, canvasW, canvasH);
		botCtx.fillStyle = "black";
		botCtx.fill();
	};

	var clearCanvas = function(ctx, canvasX, canvasY, width, height) {
		canvasX = canvasX || 0;
		canvasY = canvasY || 0;
		width = width || canvasW;
		height = height || canvasH;
		ctx.clearRect(canvasX, canvasY, width, height);
	};

	var chestOnGrid = function(grid) {
		for (var chest of chestList) {
			if (chest.mapGridX == grid.mapGridX && chest.mapGridY == grid.mapGridY) {
				return chest;
			}
		}
	};

	var wallOnGrid = function(grid) {
		var obstructions = curLevel.mapObstructedTerrain;
		for (var obs of obstructions) {
			if (grid.mapGridX == obs[0] && grid.mapGridY == obs[1]) {
				return obs;
			};
		};
	};

	// var outOfMap = function(obj) {
	// 	var box = obj.box;
	// 	if (obj.mapX - box.marginLeft < 0 || obj.mapX + obj.width >= Level.width + 1 || obj.mapY <= box.marginUp || obj.mapY + obj.height >= Level.height + 1) {
	// 		return true;
	// 	}
	// };

	var checkAllInPlace = function() {
		for (var chest of chestList) {
			if (!chest.onRect) {
				return;
			};
		};
		switch (levelN) {
			case 1:
				Level.levels[0].chests = [snakeChestPos, statueChestPos, tombChestPos];
				Map['token']['lv1'].finish = true;
				break;
			case 2:
				Level.levels[0].chests = [snakeChestPos, statueChestPos, tombChestPos];
				Map['token']['lv2'].finish = true;
				break;
			case 3:
				Level.levels[0].chests = [snakeChestPos, statueChestPos, tombChestPos];
				Map['token']['lv3'].finish = true;
				break;
			case 4:
				Level.levels[0].chests = [snakeChestPos, statueChestPos, tombChestPos];
				Map['token']['lv4'].finish = true;
				break;
		};
		levelComplish = true;
		game.switchTimeout = setTimeout(function(){switchLevel(0);}, 1000);
	};

	var checkLevelHit = function() {
		var rects = curLevel.rects,
			upRect = rects[0],
			downRect = rects[1],
			snakeChest = chestList[0],
			statueChest = chestList[1],
			tombChest = chestList[2],
			snakeChestMapGridX = snakeChest.mapGridX,
			snakeChestMapGridY = snakeChest.mapGridY,
			statueChestMapGridX = statueChest.mapGridX,
			statueChestMapGridY = statueChest.mapGridY,
			tombChestMapGridX = tombChest.mapGridX,
			tombChestMapGridY = tombChest.mapGridY;

		if (snakeChestMapGridX == downRect[0] && snakeChestMapGridY == downRect[1] && statueChestMapGridX == upRect[0] && statueChestMapGridY == upRect[1]) {
			if (!Map.token['lv1'].finish) {
				recordChestPos(snakeChestMapGridX, snakeChestMapGridY, statueChestMapGridX, statueChestMapGridY, tombChestMapGridX, tombChestMapGridY);
				levelComplish = true;
				game.switchTimeout = setTimeout(function(){switchLevel(1);}, 1000);
			}
		} else if (statueChestMapGridX == downRect[0] && statueChestMapGridY == downRect[1] && snakeChestMapGridX == upRect[0] && snakeChestMapGridY == upRect[1]) {
			if (!Map.token['lv2'].finish) {
				recordChestPos(snakeChestMapGridX, snakeChestMapGridY, statueChestMapGridX, statueChestMapGridY, tombChestMapGridX, tombChestMapGridY);
				levelComplish = true;
				game.switchTimeout = setTimeout(function(){switchLevel(2);}, 1000);
			}
		} else if (snakeChestMapGridX == downRect[0] && snakeChestMapGridY == downRect[1] && tombChestMapGridX == upRect[0] && tombChestMapGridY == upRect[1]) {
			if (!Map.token['lv3'].finish) {
				recordChestPos(snakeChestMapGridX, snakeChestMapGridY, statueChestMapGridX, statueChestMapGridY, tombChestMapGridX, tombChestMapGridY);
				levelComplish = true;
				game.switchTimeout = setTimeout(function(){switchLevel(3);}, 1000);
			}
		} else if (tombChestMapGridX == downRect[0] && tombChestMapGridY == downRect[1] && statueChestMapGridX == upRect[0] && statueChestMapGridY == upRect[1]) {
			if (!Map.token['lv4'].finish) {
				recordChestPos(snakeChestMapGridX, snakeChestMapGridY, statueChestMapGridX, statueChestMapGridY, tombChestMapGridX, tombChestMapGridY);
				levelComplish = true;
				game.switchTimeout = setTimeout(function(){switchLevel(4);}, 1000);
			}
		};
	};

	var pullBack = function() {
		var lastChest,
			lastDir,
			man,
			prePosition;
			if (!canPullBack) {
				return;
			};
			if (isEmpty(lastStatus)) {
				return;
			} else {
				lastChest = lastStatus.chest;
			}
			lastDir = lastStatus.dir;
			man = game.man;
			prePosition = lastChest.prePosition;
			lastChest.mapGridX = prePosition.mapGridX;
			lastChest.mapGridY = prePosition.mapGridY;
			lastChest.mapX = lastChest.mapGridX * tileSize + lastChest.box.marginLeft;
			lastChest.mapY = lastChest.mapGridY * tileSize + lastChest.box.marginUp;
			switch (lastDir) {
				case 'up':
					man.mapY = lastChest.mapY + lastChest.height;
					man.mapX = lastChest.mapX + man.box.marginLeft;
					break;
				case 'down':
					man.mapY = lastChest.mapY - man.height;
					man.mapX = lastChest.mapX + man.box.marginLeft;
					break;
				case 'left':
					man.mapX = lastChest.mapX + lastChest.width;
					man.mapY = lastChest.mapGridY * tileSize + man.box.marginUp;
					break;
				case 'right':
					man.mapX = lastChest.mapX - man.width;
					man.mapY = lastChest.mapGridY * tileSize + man.box.marginUp;
					break;
			};
			lastChest.dir = '';
			lastChest.arrive = true;
			needPanning = true;
			canPullBack = false;
		};

	var switchLevel = function(num) {
		clearTimeout(game.switchTimeout);
		game.switchTimeout = null;
		running = false;
		levelComplish = false;
		levelN = num;
		switch (num) {
			case 1:
				Map['token']['lv1'].found = true;
				break;
			case 2:
				Map['token']['lv2'].found = true;
				break;
			case 3:
				Map['token']['lv3'].found = true;
				break;
			case 4:
				Map['token']['lv4'].found = true;
				break;
		};
		reset();
		clearInterval(animationLoop);
		cancelAnimationFrame(game.animationFrame);
		Level.init();
		Shader.init();
		unit.init();
		game.start();
	};

	var isEmpty = function(obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				return false;
			}
		}
		return true;
	};

	var recordChestPos = function(snakeChestMapGridX, snakeChestMapGridY, statueChestMapGridX, statueChestMapGridY, tombChestMapGridX, tombChestMapGridY) {
		snakeChestPos = [snakeChestMapGridX, snakeChestMapGridY];
		statueChestPos = [statueChestMapGridX, statueChestMapGridY];
		tombChestPos = [tombChestMapGridX, tombChestMapGridY];
	};

	var initTrigger = function(trigger, from) {
		var type = trigger.type;
		if (type == 'timed') {
			trigger.timeOut = setTimeout(function(){
				runTrigger(trigger, from);
			}, trigger.time);
		} else if (type == 'conditional') {
			trigger.interval = setInterval(function(){
				runTrigger(trigger, from);
			}, trigger.time)
		}
	};

	var runTrigger = function(trigger, from) {
		var type = trigger.type;
		if (type == 'timed') {
			clearTrigger(trigger, from);
			trigger.action();
		} else if (type == 'conditional') {
			if (trigger.condition()) {
				clearTrigger(trigger, from);
				trigger.action();
			}
		}
	};

	var clearTrigger = function(trigger, from) {
		var type = trigger.type;
		if (type == 'timed') {
			if (trigger.timeOut !== null) {
				clearTimeout(trigger.timeOut);
				trigger.timeOut = null;
			}
		} else if (type == 'conditional') {
			if (trigger.interval !== null) {
				clearInterval(trigger.interval);
				trigger.interval = null;
			}
		}
		if (trigger.disposable) {
			delElem(trigger, from);
		}
	};

	var delElem = function(elem, from) {
		var index = from.indexOf(elem);
		from.splice(index, 1);
	};

	var reset = function() {
		needPanning = true;
		fog = false;
		chestList = null;
		beingList = null;
		lastStatus = null;
		curLevel = null;
		game.man = null;
	};

	var addEvent = function(el, type, fn) {
		if (window.addEventListener) {
			el.addEventListener(type, fn, false);
		} else if (document.attachEvent) {
			el.attachEvent('on' + type, fn);
		} else {
			el['on' + type] = fn;
		}
	};

	var removeEvent = function(el, type, fn) {
		if (window.addEventListener) {
			el.removeEventListener(type, fn, false);
		} else if (document.attachEvent) {
			el.detachEvent('on' + type, fn);
		} else {
			el['on' + type] = null;
		}
	};

	// var getStyles = function(elem, prop) {
	// 	if (window.getComputedStyle) {
	// 		if (prop) {
	// 			return window.getComputedStyle(elem, null)[prop];
	// 		} else {
	// 			return window.getComputedStyle(elem, null);
	// 		};
	// 	} else {
	// 		if (prop) {
	// 			return elem.currentStyle[prop];
	// 		} else {
	// 			return elem.currentStyle;
	// 		};
	// 	};
	// };

	addEvent(window, 'load', function() {
		function clickStart(e) {
			game.setup();
			removeEvent(container, 'click', clickStart);
		};
		var container = document.getElementsByClassName('game-container')[0];
		addEvent(container, 'click', clickStart);
	});
})()