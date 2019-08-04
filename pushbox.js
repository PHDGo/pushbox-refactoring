;(function(){
	const sin45 = Math.sin(45 * Math.PI / 180);
	var botCtx = null,
		stageCtx = null,
		topCtx = null,
		running = false,
		musicOn = true,
		pause = false,
		canPullBack = false,
		needPanning = true,
		weather = false,
		canvasW = 0,
		canvasH = 0,
		levelN = 0,
		tileSize = 32,
		imgGridWidth = 30,
		animationTimeOut = 100,
		rectTile = [352, 288],
		chestList = [],
		beingList = [],
		curLevel = {},
		lastStatus = {};

	var game = {
		botCanvas: document.getElementById('bot-canvas'),
		stageCanvas: document.getElementById('stage-canvas'),
		topCanvas: document.getElementById('top-canvas'),
		running: false,

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
			map.init();
			Weather.init();
			unit.init();
			ctrl.init();
		},

		animate: function() {
			unit.animate();
			if (Weather.weather) {
				Weather.animate();
			};
			Weather.animate();
			if (running) {
				game.checkComplish();
			};
		},

		draw: function() {
			clearCanvas(stageCtx);
			clearCanvas(topCtx);
			if (needPanning) {
				clearCanvas(botCtx);
				fillContext();
				map.computeBlock();
				map.draw();
			};
			unit.draw();
			if (weather) {
				Weather.draw();
			};
			Shader.switchShaders();
			game.animationFrame = requestAnimationFrame(game.draw);
		},

		start: function(ev) {
			// game.topCanvas.focus();

			// if (game.musicOn) {
			// 	game.bgm.currentTime = 0;
			// 	game.bgm.play();
			// }
			// gameStart = true;
			running = true;
			game.animate();
			game.animation = setInterval(game.animate, animationTimeOut);

			map.computeBlock(); // must after unit.init()
			map.yeildMapImg(); // must after loader.init()
			game.draw();
		}
	};

	var loader = {
		totalItemCount: 0,
		loadedItemCount: 0,
		srcList: [
			{name:'fog', url:'image/Fog', ext:'.png'},
			{name:'tileSet', url:'image/tileSet', ext:'.png'},
			{name:'sprite', url:'image/sprite', ext:'.png'},
			{name:'UI', url:'image/UI', ext:'.png'},
			{name:'clickSound', url:'sound/click', ext:'.wav'},
			{name:'bgm', url:'sound/V.A. - Toroko\'s Theme', ext:'.mp3'},
			{name:'footstepSound', url:'sound/footstep', ext:'.wav'},
			{name:'playSound', url:'sound/play', ext:'.wav'},
			{name:'correctSound', url:'sound/correct', ext:'.wav'},
			{name:'winSound', url:'sound/win', ext:'.wav'}
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
			addEvent(window, 'keydown', this.keydown);
			addEvent(window, 'keyup', this.keyup);
			addEvent(window, 'keypress', this.pullBack)
		},

		keydown: function(e) {
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
			};
		},

		keyup: function(e) {
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
			};
		},

		pullBack: function(e) {
			if (!canPullBack) {
				return;
			};
			var lastChest = lastStatus.chest,
				lastDir = lastStatus.dir,
				man = game.man,
				prePosition = lastChest.prePosition;
			e = e || window.event;
			if (e.keyCode == 120) {
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
		}
	};

	var map = {
		canvas: document.createElement('canvas'),
		init: function() {
			var GWidth,
				GHeight;
			curLevel = this.level[levelN];
			GWidth = curLevel.mapGridWidth;
			GHeight = curLevel.mapGridHeight;
			this.width = GWidth * tileSize;
			this.height = GHeight * tileSize;
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.context = this.canvas.getContext('2d');
			this.border = {};
			if (levelN == 0) {
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
				this.mapBlockX = Math.floor((man.mapX + man.width) / canvasW);
			} else {
				this.mapBlockX = Math.floor(man.mapX / canvasW);
			};
			if (ctrl.down) {
				this.mapBlockY = Math.floor((man.mapY + man.height) / canvasH);
			} else {
				this.mapBlockY = Math.floor(man.mapY / canvasH);
			};
			this.border.left = this.mapBlockX * canvasW;
			this.border.up = this.mapBlockY * canvasH;
			this.border.right = this.border.left + canvasW;
			this.border.down = this.border.up + canvasH;
			console.log(this.mapBlockX, this.mapBlockY, this.border);
		},
		
		draw: function() {
			botCtx.drawImage(this.canvas, this.mapBlockX * canvasW, this.mapBlockY * canvasH, canvasW, canvasH, 0, 0, canvasW, canvasH);
			needPanning = false;
			// var halfCanvasW = 0.5 * canvasW,
			// 	halfCanvasH = 0.5 * canvasH,
			// 	theta1 = mapX + halfCanvasW - mapW,
			// 	theta2 = mapY + halfCanvasH - mapH,
			// 	theta3 = mapY - halfCanvasH,
			// 	theta4 = mapX - halfCanvasW,
			// 	alpha1 = mapW - halfCanvasW,
			// 	alpha2 = mapH - halfCanvasH;

			// if (halfCanvasW <= mapX <= alpha1) {
			// 	if (halfCanvasH <= mapY <= alpha2) {
			// 		botCtx.drawImage(this.canvas, alpha1, alpha2, canvasW, canvasH, 0, 0, canvasW, canvasH);
			// 	} else if (0 < theta2 < mapH) {
			// 		botCtx.drawImage(this.canvas, mapX, mapY, canvasW, canvasH - h, 0, 0, canvasW, canvasH - h);
			// 		botCtx.drawImage(this.canvas, mapX, 0, canvasW, h, 0, 0, canvasW, h);
			// 	} else if (-canvasH < theta3 < 0) {
			// 		botCtx.drawImage(this.canvas, theta4, 0, canvasW, canvasH - h, 0, h, canvasW, canvasH - h);
			// 		botCtx.drawImage(this.canvas, theta4, mapH - h, canvasW, h, 0, 0, canvasW, h);
			// 	};
			// } else if (0 < theta1 < mapW) {
			// 	if (halfCanvasH <= mapY <= alpha2) {
			// 		botCtx.drawImage(this.canvas, theta4, theta3, canvasW - w, canvasH, 0, 0, canvasW - w, canvasH);
			// 		botCtx.drawImage(this.canvas, 0, theta3, W, canvasH, canvasW - w, 0, w, canvasH);							
			// 	} else if (0 < theta2 < mapH) {
			// 		botCtx.drawImage(this.canvas, theta4, theta3, canvasW - w, canvasH - h, 0, 0, canvasW - w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, 0, theta3, w, canvasH - h, canvasW - w, 0, w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, theta4, 0, canvasW - w, h, 0, canvasH - h, canvasw - w, h);
			// 		botCtx.drawImage(this.canvas, 0, 0, w, h, canvasW - w, canvasH - h, w, h);
			// 	} else if (-canvasH < theta3 < 0) {
			// 		botCtx.drawImage(this.canvas, theta4, 0, canvasW - w, canvasH - h, 0, h, canvasW - w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, theta4, mapH - h, canvasW - w, h, 0, 0, canvasW - w, h);
			// 		botCtx.drawImage(this.canvas, 0, 0, w, canvasH - h, canvasW - w, 0, w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, 0, mapH - h, w, h, canvasW - w, 0, w, h);
			// 	};
			// } else if (-canvasW < theta4 < 0) {
			// 	if (halfCanvasH <= mapY <= alpha2) {
			// 		botCtx.drawImage(this.canvas, 0, theta3, mapW - w, mapH, canvasW - w, 0, mapW - w, mapH);
			// 		botCtx.drawImage(this.canvas, mapW - w, theta3, w, canvasH, 0, 0, w, canvasH);
			// 	} else if (-canvasH < theta3 < 0) {
			// 		botCtx.drawImage(this.canvas, 0, 0, canvasW - w, canvasH - h, w, h, canvasW - w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, 0, w, canvasW - w, h, w, 0, canvasW - w, h);
			// 		botCtx.drawImage(this.canvas, mapW - w, 0, w, mapH - h, 0, h, w, mapH - h);
			// 		botCtx.drawImage(this.canvas, mapW - w, mapH - h, w, h, 0, 0, w, h);
			// 	} else if (0 < theta2 < mapH) {
			// 		botCtx.drawImage(this.canvas, 0, theta3, canvasW - w, canvasH - h, w, 0, canvasW - w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, mapW - w, theta3, w, canvasH - h, 0, 0, w, canvasH - h);
			// 		botCtx.drawImage(this.canvas, 0, 0, canvasW - w, h, w, canvasH - h, canvasW - w, h);
			// 		botCtx.drawImage(this.canvas, mapW - w, 0, w, h, canvasH - h, 0, w, h);
			// 	};
			// };
		},

		"level": [
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
				"mapGridWidth": 26,
				"mapGridHeight": 12,
				"born": {x: 19, y: 8},
				"chests": [[17,3],[21,3],[19,5]],
				"chestImgPos": [0, 64],
				"rects": [[19,2],[19,3]],
				"torches": [],
				"mapObstructedTerrain":[],
				"terrain":[
					[275,272,272,272,272,272,273,273,273,272,273,211,272,273,211,211,273,211,211,211,211,272,211,273,211,211],
					[272,272,272,273,273,273,272,272,272,272,273,273,273,211,211,273,211,211,263,222,262,211,211,211,273,211],
					[272,272,272,273,273,273,273,273,273,272,211,211,273,211,272,211,211,211,225,229,218,273,211,211,211,273],
					[272,272,273,273,272,273,273,273,273,273,211,211,273,273,273,272,211,279,226,231,218,277,272,272,272,272],
					[272,272,273,273,211,273,211,273,273,273,211,211,273,272,272,211,272,211,261,220,260,273,211,273,273,275],
					[272,272,272,273,273,273,211,273,272,273,211,211,273,211,211,277,272,273,211,279,272,272,272,273,272,273],
					[272,211,272,273,273,273,273,273,272,273,211,211,273,273,273,272,272,272,272,272,272,272,273,272,273,273],
					[272,273,273,274,273,273,211,273,273,273,211,273,273,272,211,272,272,272,272,273,274,273,263,262,211,272],
					[272,273,211,272,211,272,273,273,272,273,211,273,272,273,272,273,272,273,272,273,272,272,261,260,273,272],
					[211,273,273,272,211,211,211,272,273,273,273,273,272,273,272,272,273,273,273,272,272,272,273,272,272,272],
					[272,272,273,273,272,272,272,272,273,273,273,273,272,211,274,272,273,273,272,273,273,211,274,272,273,273],
					[272,272,272,273,273,273,272,273,272,272,273,211,273,272,272,273,272,273,272,273,272,272,273,273,272,272]
				],
				"shade":{},
				"weather": 'fog'
			},
			{
				"mapName": "room1",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 10, y: 6},
				"chests":[[4,6],[9,6],[4,7],[8,7],[9,7],[9,8]],
				"chestImgPos": [0, 64],
				"rects":[[6,6],[7,6],[6,7],[7,7],[6,8],[7,8]],
				"torches":[[5,3],[9,4]],
				"mapObstructedTerrain":[[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[2,5],[7,5],[8,5],[9,5],[10,5],[11,5],[2,6],[11,6],[2,7],[3,7],[11,7],[3,8],[11,8],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,31,44,44,44,44,82,0,0,0,0,0],
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
							[0,0,83,0,0,0,0,0,0,0,0,0,0],
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
				"weather": ''
			},
			{
				"mapName": "room2",
				"mapGridWidth":13,
				"mapGridHeight":12,
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
				"weather": ''
			},
			{
				"mapName": "room3",
				"mapGridWidth": 13,
				"mapGridHeight": 12,
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
				"weather": ''
			},
			{
				"mapName": "room4",
				"mapGridWidth":13,
				"mapGridHeight":12,
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
				"weather": ''
			}
		]
	};

	var Weather = {
		init: function() {
			if (curLevel.weather) {
				weather = true;
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
			topCtx.globalAlpha = 0.2;
			topCtx.drawImage(game.fog, this.X, 0, canvasW, canvasH);
			topCtx.drawImage(game.fog, this.X + canvasW, 0, canvasW, canvasH);
		}
	};

	var Shader = {
		switchShaders: function() {
			var shades = curLevel.shade,
				man = game.man;
			for (var k in shades) {
				var shade = shades[k].tiles;
				if (k == man.inShade) {
					topCtx.globalAlpha = 0.6;
				} else {
					topCtx.globalAlpha = 1;
				};
				this.drawShaders(shade);
			}
			// if (game.pause()) {
			// 	game.foreforegroundCtx.drawImage(pausedScreen.canvas, 0, 0);
			// }
		},

		drawShaders: function(shade) {
			var	GWidth = curLevel.mapGridWidth,
				GHeight = curLevel.mapGridHeight,
				tileSet = game.tileSet,
				tileID,
				tileX,
				tileY;
			for (var i = 0; i < GHeight; i++) {
				for (var j = 0; j < GWidth; j++) {
					tileID = shade[i][j];
					tileX = (tileID - 1) % imgGridWidth;
					tileY = Math.floor((tileID - 1) / imgGridWidth);
					topCtx.drawImage(tileSet, tileX * tileSize, tileY * tileSize, tileSize, tileSize, j * tileSize, i * tileSize, tileSize, tileSize);
				}
			}
		}
	};

	var unit = {
		init: function() {
			var torches = curLevel.torches,
				chests = curLevel.chests,
				chestslen = chests.length,
				mapName = curLevel.mapName,
				imgPositions = [[0, 64], [160, 64], [320, 64]],
				id = 1,
				mapGridCoor,
				chestImgPos,
				torch,
				chest,
				man,
				oItem;

			for (var mapGridCoor of torches) {
				oItem = {mapX: mapGridCoor[0] * tileSize, mapY: mapGridCoor[1] * tileSize};
				torch = Object.assign(oItem, Torch);
				beingList.push(torch);
			};

			chestImgPos = curLevel.chestImgPos;
			for (var i = 0; i < chestslen; i++) {
				mapGridCoor = chests[i];
				if (mapName == "room0") {
					chestImgPos = imgPositions[i];
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
		this.prePosition = {mapGridX: this.mapGridX, mapGridY: this.mapGridY};
		this.width = tileSize - box.marginLeft - box.marginRight;
		this.height = tileSize - box.marginUp - box.marginDown;

		this.dir = '';
		this.speed = oProp.speed;
		this.curFrameIndex = 0;
		this.animFrame = 0;
		this.imgPos = oProp.imgPos;
	};

	var commonFunc = {
		draw: function(){
			var border = map.border,
				frameWidth = this.frameWidth,
				frameHeight = this.frameHeight,
				imgPos = this.imgPos,
				spritePos = [imgPos[0] + this.curFrameIndex * frameWidth, imgPos[1]],
				canvasX = this.mapX - this.pixelOffsetX - border.left,
				canvasY = this.mapY - this.pixelOffsetY - border.up;
			stageCtx.drawImage(game.sprite,  spritePos[0], spritePos[1], frameWidth, frameHeight, canvasX, canvasY, frameWidth, frameHeight);
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

		// restorePosition: function(dir) {
		// 	switch (dir) {
		// 		case 'up':
		// 		case 'down':
		// 			this.Y = this.prePosition.Y;
		// 			break;
		// 		case 'left':
		// 		case 'right':
		// 			this.X = this.prePosition.X;
		// 			break;
		// 	}
		// }
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
			marginUp: 10,
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

			for (var k in shades) {
				var data = shades[k].shadeData,
					len = data.length;
				for (var i = 0; i < len; i++) {
					var obj = data[i],
						grid = {
							mapX: obj[0] * tileSize,
							mapY: obj[1] * tileSize,
							box: {
								left: 0,
								right: 0,
								up: 0,
								down: 0
							}
						};
					if (this.intersects(grid)) {
						return k;
					}
				}
			}
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
			if (!running) {
				return;
			};

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

			if (left) {
				if (act !== 'walkL') {
					this.processOrder('walk', {faceTo: 'L'});
				};
				if (up || down) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.mapX -= speed;
				if (this.mapX < map.border.left) {
					if (this.mapX < 0) {
						this.mapX = map.width - this.box.marginLeft;
					};
					needPanning = true;
				};
				chests = this.intersectWithChest();
				grid = this.intersectWithWall();
				nOfChests = chests.length;
				if (grid) {
					this.mapX = grid.mapX + tileSize;
				} else if (nOfChests > 1) {
					chest = chests[0];
					this.mapX = chest.mapX + chest.width;
				} else if (nOfChests == 1) {
					chest = chests[0];
					if (this.mapX < chest.mapX + chest.width) {
						this.mapX = chest.mapX + chest.width;
					};
					this.processOrder('pushBox', {dir: 'left', interObj: chest});
				};
			};
			if (right) {
				if (act !== 'walkR') {
					this.processOrder('walk', {faceTo: 'R'});
				};
				if (up || down) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.mapX += speed;
				if (this.mapX + this.width > map.border.right) {
					if (this.mapX + this.width > map.width) {
						this.mapX = -this.width + this.box.marginRight;
					};
					needPanning = true;
				};
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
			};
			if (up) {
				if (act !== 'walkL' && act !== 'walkR') {
					this.processOrder('walk', {});
				};
				if (left || right) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.mapY -= speed;
				if (this.mapY < map.border.up) {
					if (this.mapY < 0) {
						this.mapY = map.height - this.box.marginUp;
					};
					needPanning = true;
				};
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
			};
			if (down) {
				if (act !== 'walkL' && act !== 'walkR') {
					this.processOrder('walk', {});
				};
				if (left || right) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.mapY += speed;
				if (this.mapY + this.height > map.border.down) {
					if (this.mapY  + this.height > map.height) {
						this.mapY = -this.height + this.box.marginDown;
					};
					needPanning = true;
				};
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
			};
			if (!(up || down || left || right)) { // no keyboard input
				if (act !== 'standL' && act !== 'standR') { // not standing
					if (act !== 'playL' && act !== 'playR') { // not playing
						this.processOrder('stand', {});
					};
				} else { // is standing
					if (Math.random() > 0.99) { this.processOrder('play', {}) }; // random waiting action
				};
			};
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
		/*
		calculateCoor: function() {
			var	interGrid,
				interChest,
				dir = this.dir;
			if (dir && this.speed) {
				switch (this.dir) {
					case 'up':
						if (this.speed > 0) {
							this.Y -= this.speed;
							interGrid = this.intersectWithWall();
							interChest = this.intersectWithChest();
							interChestLen = interChest.length;
							if (interGrid) {
								this.Y = interGrid.Y + tileSize;
							} else if (interChestLen) {
								this.Y = interChest[0].Y + interChest[0].height;
							}
							this.speed += this.friction;
						} else {
							this.dir = '';
						};
						break;
					case 'down':
						if (this.speed > 0) {
							this.Y += this.speed;
							interGrid = this.intersectWithWall(),
							interChest = this.intersectWithChest();
							interChestLen = interChest.length;
							if (interGrid) {
								this.Y = interGrid.Y - this.height;
							} else if (interChestLen) {
								this.Y = interChest[0].Y - this.height;
							}
							this.speed += this.friction;
						} else {
							this.dir = '';
						};
						break;
					case 'left':
						if (this.speed > 0) {
							this.X -= this.speed;
							interGrid = this.intersectWithWall(),
							interChest = this.intersectWithChest();
							interChestLen = interChest.length;
							if (interGrid) {
								this.X = interGrid.X + tileSize;
							} else if (interChestLen) {
								this.X = interChest[0].X + interChest[0].width;
							}
							this.speed += this.friction;
						} else {
							this.dir = '';
						};
						break;
					case 'right':
						if (this.speed > 0) {
							this.X += this.speed;
							interGrid = this.intersectWithWall(),
							interChest = this.intersectWithChest();
							interChestLen = interChest.length;
							if (interGrid) {
								this.X = interGrid.X - this.width;
							} else if (interChestLen) {
								this.X = interChest[0].X - this.width;
							}
							this.speed += this.friction;
						} else {
							this.dir = '';
						};
						break;
				}
			}
		},*/

		calculateCoor: function() {
			var	interGrid,
				interChest,
				interChestLen,
				nextMapGridX,
				nextMapGridY,
				vx,
				vy;
			if (this.dir) {
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
						if (this.mapY - 1 <= this.nextY) {
							this.mapGridY = this.nextMapGridY;
							this.mapY = this.nextY;
							if (this.mapGridY < 0) {
								this.mapGridY = curLevel.mapGridHeight - 1;
								this.mapY = this.mapGridY * tileSize + this.box.marginUp;
							};
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
						if (this.mapY + 1 >= this.nextY) {
							this.mapGridY = this.nextMapGridY;
							this.mapY = this.nextY;
							if (this.mapGridY >= curLevel.mapGridHeight) {
								this.mapGridY = 0;
								this.mapY = this.mapGridY * tileSize + this.box.marginUp;
							};
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
						if (this.mapX - 1 <= this.nextX) {
							this.mapGridX = this.nextMapGridX;
							this.mapX = this.nextX;
							if (this.mapGridX < 0) {
								this.mapGridX = curLevel.mapGridWidth - 1;
								this.mapX = this.mapGridX * tileSize + this.box.marginLeft;
							};
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
						if (this.mapX + 1 >= this.nextX) {
							this.mapGridX = this.nextMapGridX;
							this.mapX = this.nextX;
							if (this.mapGridX >= curLevel.mapGridWidth) {
								this.mapGridX = 0;
								this.mapX = this.mapGridX * tileSize + this.box.marginLeft;
							};
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

		animate: function() {
			var step = Math.random() > 0.5 ? 0 : 1;
			this.curFrameIndex += step;
			if (this.curFrameIndex >= 4) {
				this.curFrameIndex = 1;
			};
		},
		draw: commonFunc.draw,
	};

	// var particle = {
	// 	numFog: 10,
	// 	fogs: [],
	// 	init: function() {
	// 		numFog = this.numFog;
	// 		for (var fog, i = 0; i < numFog; i++) {
	// 			fog = new Fog();
	// 			fog.x = canvasW;
	// 			fog.Y = Math.random() * canvasH;
	// 			fog.width = Math.random() * tileSize * 2;
	// 			fog.height = Math.random() * tileSize;
	// 			fog.vx = -8 + Math.random() * 5;
	// 			fog.vy = Math.sin(this.angle) * 4;
	// 			fog.angle = Math.random() * 10;
	// 			fog.alpha = Math.random() / 3;
	// 			this.fogs.push(fog);
	// 		};
	// 	},

	// 	animate: function() {
	// 		this.fogs.forEach(function(fog){
	// 			fog.animate();
	// 		});
	// 	},

	// 	draw: function() {
	// 		if (levelN !== 0) {
	// 			return;
	// 		};
	// 		this.fogs.forEach(function(fog){
	// 			fog.draw(topCtx);
	// 		});
	// 	}
	// }

	// var Fog = function() {
	// 	this.x = 0;
	// 	this.y = 0;
	// 	this.vx = 0;
	// 	this.vy = 0;
	// 	// this.scaleX = 0;
	// 	// this.scaleY = 0;
	// 	this.width = 0;
	// 	this.height = 0;
	// 	this.angle = 0;
	// 	this.alpha = 0;
	// 	this.color = '#fff';
	// };

	// Fog.prototype.draw = function(ctx) {
	// 	ctx.save();
	// 	ctx.globalAlpha = this.alpha;
	// 	ctx.translate(this.x, this.y);
	// 	// ctx.scale(this.scaleX, this.scaleY);
	// 	ctx.fillStyle = this.color;
	// 	ctx.fillRect(0, 0, this.width, this.height);
	// 	ctx.restore();
	// };

	// Fog.prototype.animate = function() {
	// 	this.x += this.vx;
	// 	this.y += this.vy;
	// 	this.angle += 0.1;
	// 	this.vy = Math.sin(this.angle) * 4;
	// 	if (this.x < 0) {
	// 		this.x = canvasH;
	// 		this.y = Math.random() * canvasH;
	// 		this.width = Math.random() * tileSize * 2;
	// 		this.height = Math.random() * tileSize;
	// 		this.vx = -1 + Math.random() / 2;
	// 		this.vy = Math.sin(this.angle) * 0.01;
	// 		this.angle = Math.random() * 10;
	// 		this.alpha = Math.random() / 3;
	// 	};
	// };

	var fillContext = function() {
		botCtx.rect(0, 0, canvasW, canvasH);
		botCtx.fillStyle = "black";
		botCtx.fill();
	};

	var clearCanvas = function(ctx) {
		ctx.clearRect(0, 0, canvasW, canvasH);
	};

	var showScreen = function(id) {
		var screen = document.getElementById(id);
		screen.style.display = 'block';
	};

	var hideScreen = function (id) {
		var screen = document.getElementById(id);
		screen.style.display = 'none';
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

	var checkAllInPlace = function() {
		for (var chest of chestList) {
			if (!chest.onRect) {
				return;
			};
		};
		switchLevel(0);
	};

	var checkLevelHit = function() {
		if (!running) {
			return;
		};

		var rects = curLevel.rects,
			upRect = rects[0],
			downRect = rects[1],
			snakeChest = chestList[0],
			statueChest = chestList[1],
			tombChest = chestList[2];
		
		if (snakeChest.mapGridX == upRect[0] && snakeChest.mapGridY == upRect[1] && statueChest.mapGridX == downRect[0] && statueChest.mapGridY == downRect[1]) {
			switchLevel(1);
		} else if (snakeChest.mapGridX == downRect[0] && snakeChest.mapGridY == downRect[1] && statueChest.mapGridX == upRect[0] && statueChest.mapGridY == upRect[1]) {
			switchLevel(2);
		} else if (snakeChest.mapGridX == upRect[0] && snakeChest.mapGridY == upRect[1] && tombChest.mapGridX == downRect[0] && tombChest.mapGridY == downRect[1]) {
			switchLevel(3);
		} else if (statueChest.mapGridX == upRect[0] && statueChest.mapGridY == upRect[1] && tombChest.mapGridX == downRect[0] && tombChest.mapGridY == downRect[1]) {
			switchLevel(4);
		} else if (snakeChest.mapGridX == downRect[0] && snakeChest.mapGridY == downRect[1] && tombChest.mapGridX == upRect[0] && tombChest.mapGridY == upRect[1]) {
			switchLevel(5);
		};
	};

	var switchLevel = function(num) {
		running = false;
		levelN = num;
		setTimeout(function() {
			reset();
			clearInterval(game.animation);
			cancelAnimationFrame(game.animationFrame);
			map.init();
			if (levelN == 0) {
				particle.init();
			};
			unit.init();
			game.start();
		}, 1000);
	};

	var reset = function() {
		needPanning = true;
		weather = false;
		chestList = [];
		beingList = [];
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

	addEvent(window, 'load', function() {
		function clickStart(e) {
			game.setup.call(game);
			removeEvent(container, 'click', clickStart);
		};
		var container = document.getElementsByClassName('game-container')[0];
		addEvent(container, 'click', clickStart);
	});
})()