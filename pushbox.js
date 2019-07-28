;(function(){
	const sin45 = Math.sin(45 * Math.PI / 180);
	var botCtx = null,
		stageCtx = null,
		topCtx = null,
		gameStart = false,
		musicOn = true,
		pause = false,
		pullingBack = true,
		levelFinished = false,
		canvasW = 0,
		canvasH = 0,
		levelN = 0,
		counter = 0,
		tileSize = 32,
		imgGridWidth = 30,
		animationTimeOut = 100,
		rectTile = [352, 288],
		chestList = [],
		beingList = [],
		curLevel = {};

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
			map.init();
			unit.init();
			ctrl.init();
		},

		animate: function() {
			unit.animate();
			console.log('left:', ctrl.left, 'right:', ctrl.right, 'up:', ctrl.up, 'down:', ctrl.down, 'ctrl.dir:', ctrl.dir);
		},

		draw: function() {
			clearCanvas();
			unit.draw();
			Shader.switchShaders();
			requestAnimationFrame(game.draw);
		},

		start: function(ev) {
			// game.topCanvas.focus();

			// if (game.musicOn) {
			// 	game.bgm.currentTime = 0;
			// 	game.bgm.play();
			// }
			// gameStart = true;
			
			game.animate();
			game.animation = setInterval(game.animate, animationTimeOut);

			fillContext();
			map.draw();
			game.draw();
		}
	};

	var loader = {
		totalItemCount: 0,
		loadedItemCount: 0,
		srcList: [
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
			for (var i = 0; i < this.srcList.length; i++ ) {
				item = this.srcList[i];
				if (item.ext == '.png') {
					game[item.name] = this.loadImage(item.url + item.ext);
					console.log(item.name + ':'+ item.url + item.ext + '-' + this.loadedItemCount);
				} else {
					game[item.name] = this.loadAudio(item.url + item.ext);
					console.log(item.name + ':'+ item.url + item.ext + '-' + this.loadedItemCount);
				}
			}
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
	};

	var map = {
		init: function() {
			curLevel = this.level[levelN];
		},

		draw: function() {
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
					tileX = (tileID - 1) % imgGridWidth;
					tileY = Math.floor((tileID - 1) / imgGridWidth);
					botCtx.drawImage(tileSet, tileX * tileSize, tileY * tileSize, tileSize, tileSize, j * tileSize, i * tileSize, tileSize, tileSize);
				}
			};

			for (var i = 0; i < len; i++) {
				rect = rects[i];
				tileX = rect[0] * tileSize;
				tileY = rect[1] * tileSize;
				botCtx.drawImage(tileSet, rectTile[0], rectTile[1], tileSize, tileSize, tileX, tileY, tileSize, tileSize);
			};
		},

		// drawRect: function() {
		// 	var tileSet = game.tileSet,
		// 		rects = curLevel.rects,
		// 		rect;

		// 	for (var i = 0; i < rects.length; i++) {
		// 		rect = this.underChest(rects[i]) ? rectUnderChest : odinaryRect;
		// 		stageCtx.drawImage(tileSet, rect[0], rect[1], 32, 32, rects[i].x * tileSize, rects[i].y * tileSize, tileSize, tileSize);
		// 	}
		// },

		"level": [
			{
				"mapName": "room0",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 4, y: 4},
				"chests":[[6,4]],
				"rects":[[6,6]],
				"mapObstructedTerrain":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[0,3],[12,3],[0,4],[12,4],[0,5],[12,5],[0,6],[12,6],[0,7],[12,7],[0,8],[12,8],[0,9],[12,9],[0,10],[12,10],[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11]],
				"terrain":[
					[83,44,42,44,44,35,235,34,44,44,44,43,82],
					[47,125,122,123,124,126,231,121,124,125,123,122,38],
					[47,155,152,153,154,156,229,151,154,155,153,152,38],
					[47,212,219,221,220,221,264,221,221,219,221,270,38],
					[47,218,273,211,211,211,211,211,211,211,273,227,36],
					[46,218,263,262,211,263,222,262,211,211,273,227,38],
					[47,217,261,260,211,225,236,218,211,277,211,226,38],
					[45,218,211,211,211,261,220,260,211,211,211,227,38],
					[47,218,211,211,211,211,211,211,211,211,211,227,38],
					[81,217,211,211,276,211,211,211,211,274,211,261,80],
					[31,283,211,211,211,211,211,211,211,211,211,284,31],
					[31,31,31,31,31,31,31,31,31,31,31,31,31]
				],
				"shade":{
					"shade0":{
						"shadeData":[[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[1,10],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,39,41,41,41,40,41,41,41,41,39,41,0],
							[0,31,31,31,31,31,31,31,31,31,31,31,0],
							[0,31,31,31,31,31,31,31,31,31,31,31,0]
						]
					}
				}
			},
			{
				"mapName": "room2",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 7, y: 6},
				"chests":[[6,5],[5,6],[8,6],[7,7]],
				"rects":[[6,4],[4,6],[9,6],[7,8]],
				"torches":[[8, 4]],
				"mapObstructedTerrain":[[5,1],[6,1],[7,1],[5,2],[6,2],[7,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[3,4],[4,4],[5,4],[7,4],[8,4],[9,4],[10,4],[3,5],[4,5],[5,5],[7,5],[8,5],[9,5],[10,5],[3,6],[10,6],[3,7],[4,7],[5,7],[6,7],[8,7],[9,7],[10,7],[6,8],[8,8],[6,9],[7,9],[8,9]],
				"terrain":[
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,83,44,82,0,0,0,0,0],
					[0,0,0,0,0,47,124,38,0,0,0,0,0],
					[0,0,0,83,43,35,154,34,44,44,82,0,0],
					[0,0,0,47,123,126,236,121,122,124,38,0,0],
					[0,0,0,31,123,126,211,151,152,154,38,0,0],
					[0,0,0,31,236,211,211,211,211,236,31,0,0],
					[0,0,0,31,31,31,31,278,31,31,31,0,0],
					[0,0,0,0,0,0,31,211,31,0,0,0,0],
					[0,0,0,0,0,0,31,31,31,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0,0,0,0,0]
				],
				"shade":{
					"shade0":{
						"shadeData":[[3,5],[4,5],[5,5],[6,5],[8,5],[9,5],[10,5],[4,6],[5,6],[6,6],[8,6],[9,6],[6,7],[7,7],[8,7],[7,8]],
						"tiles":[
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,81,41,41,33,0,32,41,80,0,0],
							[0,0,0,0,31,31,47,0,38,31,0,0,0],
							[0,0,0,0,0,0,81,41,80,0,0,0,0],
							[0,0,0,0,0,0,0,31,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0],
							[0,0,0,0,0,0,0,0,0,0,0,0,0]
						]
					},
				}
			},
			{
				"mapName": "room3",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 10, y: 6},
				"chests":[[4,6],[9,6],[4,7],[8,7],[9,7],[9,8]],
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
				}
			},
			{
				"mapName": "room4",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 11, y: 5},
				"chests":[[10,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[10,6],[10,7]],
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
				}
			},
			{
				"mapName": "room5",
				"mapGridWidth": 13,
				"mapGridHeight": 12,
				"born": {x: 7, y: 6},
				"chests":[[6,5],[7,5],[8,5],[6,6],[8,6],[6,7],[7,7],[8,7]],
				"rects":[[5,4],[7,4],[9,4],[5,6],[9,6],[5,8],[7,8],[9,8]],
				"torches": [[5,2],[9,2]],
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
				}
			},
			{
				"mapName": "room6",
				"mapGridWidth":13,
				"mapGridHeight":12,
				"born": {x: 6, y: 4},
				"chests":[[5,5],[7,5],[4,6],[6,6],[8,6],[5,7],[7,7],[4,8],[6,8],[8,8],[5,9],[7,9]],
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
				}
			}
		]
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
			var chests = curLevel.chests,
				chestslen = chests.length,
				id = 1,
				mapGridCoor,
				chest,
				man,
				oItem;

			for (var i = 0; i < chestslen; i++) {
				mapGridCoor = chests[i];
				oItem = {type: "chest", id: id++, box: Chest.box, gridWidth: 1, gridHeight: 2, mapGridX: mapGridCoor[0], mapGridY: mapGridCoor[1], speed: 0};
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
					gridWidth: 2,
					gridHeight: 2,
					mapGridX: curLevel.born.x,
					mapGridY: curLevel.born.y,
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
			}
		},

		draw: function() {
			var sortedBeingList = Object.assign([], beingList);
			sortedBeingList.sort(function(a, b){
				return a.Y - b.Y;
			});
			sortedBeingList.forEach(function(being){
				being.draw();
			});
		}
	};

	var fillContext = function() {
		botCtx.rect(0, 0, canvasW, canvasH);
		botCtx.fillStyle = "black";
		botCtx.fill();
	};

	var clearCanvas = function() {
		stageCtx.clearRect(0, 0, canvasW, canvasH);
		topCtx.clearRect(0, 0, canvasW, canvasH);
	};

	var showScreen = function(id) {
		var screen = document.getElementById(id);
		screen.style.display = 'block';
	};

	var hideScreen = function (id) {
		var screen = document.getElementById(id);
		screen.style.display = 'none';
	};

	var boxObj = function(oProp) {
		var actions = oProp.actions,
			startIndex = 0,
			box = oProp.box,
			frame,
			name,
			options = {
				type: "",
				id: 0,
				box: {},
				gridWidth: 0,
				gridHeight: 0,
				mapGridX: 0,
				mapGridY: 0,
				speed: 0
			};
		for (var option in options) {
			if (!oProp.hasOwnProperty(option)) {
				console.log(new Error('Oops! Something fuck up'));
				return;
			};
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
		}

		this.type = oProp.type;
		this.id = oProp.id;
		this.frameWidth = oProp.gridWidth * tileSize;
		this.frameHeight = oProp.gridHeight * tileSize;

		this.mapGridX = oProp.mapGridX;
		this.mapGridY = oProp.mapGridY;
		this.pixelOffsetX = offsetX + box['marginLeft'];
		this.pixelOffsetY = offsetY + box['marginUp'];
		this.X = this.mapGridX * tileSize + box['marginLeft'];
		this.Y = this.mapGridY * tileSize + box['marginUp'];
		this.prePosition = {X: this.X, Y: this.Y};
		this.width = tileSize - box.marginLeft - box.marginRight;
		this.height = tileSize - box.marginUp - box.marginDown;

		this.dir = '';
		this.speed = oProp.speed;
		this.curFrameIndex = 0;
		this.animFrame = 0;
		this.imgPos = [0, 0];
	};

	var commonFunc = {
		draw: function(){
			var frameWidth = this.frameWidth,
				frameHeight = this.frameHeight,
				imgPos = this.imgPos,
				spritePos = [imgPos[0] + this.curFrameIndex * frameWidth, imgPos[1]];
			stageCtx.drawImage(game.sprite,  spritePos[0], spritePos[1], frameWidth, frameHeight, this.X - this.pixelOffsetX, this.Y - this.pixelOffsetY, frameWidth, frameHeight);
		},

		intersects: function(rectObj) {
			return !(this.X + this.width <= rectObj.X ||
					 rectObj.X + rectObj.width <= this.X ||
					 this.Y + this.height <= rectObj.Y ||
					 rectObj.Y + rectObj.height <= this.Y
					);
		},

		intersectWithWall: function() {
			var obstructions = curLevel.mapObstructedTerrain,
				len = obstructions.length;
			for (var i = 0; i < len; i++) {
				var obs = obstructions[i],
					grid = {
						X: obs[0] * tileSize,
						Y: obs[1] * tileSize,
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

		restorePosition: function(dir) {
			switch (dir) {
				case 'up':
				case 'down':
					this.Y = this.prePosition.Y;
					break;
				case 'left':
				case 'right':
					this.X = this.prePosition.X;
					break;
			}
		}
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
			var rawActions = this.rawActions,
				startIndex = 0,
				rawAction,
				frame,
				name;
			this.imgPos = [0, 0];
			this.actions = {};
			for (var rawAction of rawActions) {
				name = rawAction['name'];
				frame = rawAction['frame'];
				this.actions[name] = {name: name, startIndex: startIndex, frame: frame};
				startIndex += frame;
			};
			this.oAct = this.actions['standR'];
			this.faceTo = 'R';
			this.pushSpeed = 5;
			console.log(this.actions)
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
							X: obj[0] * tileSize,
							Y: obj[1] * tileSize,
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
			// console.log(this.oAct);
			this.calculateCoor();
			this.inShade = this.detectInShade();
		},

		processOrder:function(order, details) {
			var startIndex;
			switch (order) {
				case 'pushBox':
					details.interObj.processOrder('move', details);
					details.faceTo = details.faceTo || this.faceTo;
					var nextAct = 'walk' + details.faceTo;
					this.alterFrame(nextAct, details);
					break;
				case 'stand':
					details.faceTo = details.faceTo || this.faceTo;
					var nextAct = 'stand' + details.faceTo;
					this.alterFrame(nextAct, details);
					if (Math.random() > 0.99) { this.processOrder('play', {}) };
				case 'walk':
					details.faceTo = details.faceTo || this.faceTo;
					var nextAct = 'walk' + details.faceTo;
					this.alterFrame(nextAct, details);
					break;
				case 'play':
					details.faceTo = details.faceTo || this.faceTo;
					var nextAct = 'play' + details.faceTo;
					this.alterFrame(nextAct, details);
					break;
			}
		},

		alterFrame: function(nextAct, details) {
			var startIndex;
			if (this.oAct.name !== nextAct) {
				this.oAct = this.actions[nextAct];
				this.faceTo = details.faceTo;
				this.curFrameIndex = this.oAct.startIndex;
			} else {
				this.curFrameIndex++;
				startIndex = this.oAct.startIndex;
				if (this.curFrameIndex >= startIndex + this.oAct.frame) {
					this.curFrameIndex = startIndex;
				};
			};
		},

		calculateCoor: function() {
			var left = ctrl.left,
				right = ctrl.right,
				up = ctrl.up,
				down = ctrl.down,
				speed = this.speed,
				pushSpeed = this.pushSpeed,
				chests,
				grid,
				nOfChests,
				chest;
			if (left) {
				if (up || down) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.X -= speed;
				chests = this.intersectWithChest();
				grid = this.intersectWithWall();
				nOfChests = chests.length;
				if (grid) {
					this.X = grid.X + tileSize;
				} else if (nOfChests > 1) {
					// this.restorePosition(dir);
					chest = chests[0];
					this.X = chest.X + chest.width;
				} else if (nOfChests == 1) {
					chest = chests[0];
					if (this.X < chest.X + chest.width) {
						this.X = chest.X + chest.width;
					};
					this.processOrder('pushBox', {faceTo: 'L', dir: 'left', distance: pushSpeed, interObj: chests[0]});
				} else {
					this.processOrder('walk', {faceTo: 'L'});
				};
				// this.prePosition.X = this.X;
			};
			if (right) {
				if (up || down) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.X += speed;
				chests = this.intersectWithChest();
				grid = this.intersectWithWall();
				nOfChests = chests.length;
				if (grid) {
					this.X = grid.X - this.width;
				} else if (nOfChests > 1) {
					// this.restorePosition(dir);
					var chest = chests[0];
					this.X = chest.X - this.width;
				} else if (nOfChests == 1) {
					chest = chests[0];
					if (this.X > chest.X - this.width) {
						this.X = chest.X - this.width;
					};
					this.processOrder('pushBox', {faceTo: 'R', dir: 'right', distance: pushSpeed, interObj: chests[0]});
				} else {
					this.processOrder('walk', {faceTo: 'R'});
				};
				// this.prePosition.X = this.X;
			};
			if (up) {
				if (left || right) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.Y -= speed;
				chests = this.intersectWithChest();
				grid = this.intersectWithWall();
				nOfChests = chests.length;
				if (grid) {
					this.Y = grid.Y + tileSize;
				} else if (nOfChests > 1) {
					// this.restorePosition(dir);
					var chest = chests[0];
					this.Y = chest.Y + chest.height;
				} else if (nOfChests == 1) {
					chest = chests[0];
					if (this.Y < chest.Y + chest.height) {
						this.Y = chest.Y + chest.height;
					};
					this.processOrder('pushBox', {dir: 'up', distance: pushSpeed, interObj: chests[0]});
				} else {
					this.processOrder('walk', {});
				};
				// this.prePosition.Y = this.Y;
			};
			if (down) {
				if (left || right) {
					speed = this.speed * sin45;
					pushSpeed = this.pushSpeed * sin45;
				};
				this.Y += speed;
				chests = this.intersectWithChest();
				grid = this.intersectWithWall();
				nOfChests = chests.length;
				if (grid) {
					this.Y = grid.Y - this.height;
				} else if (nOfChests > 1) {
					// this.restorePosition(dir);
					var chest = chests[0];
					this.Y = chest.Y - this.height;
				} else if (nOfChests == 1) {
					chest = chests[0];
					if (this.Y > chest.Y - this.height) {
						this.Y = chest.Y - this.height;
					};
					this.processOrder('pushBox', {dir: 'down', distance: pushSpeed, interObj: chests[0]});
				} else {
					this.processOrder('walk', {});
				};
				// this.prePosition.Y = this.Y;
			};
			if (!(up || down || left || right)) {
				var name = this.oAct.name,
					len = name.length,
					act = name.slice(0, len - 1);
				if (act !== 'play') {
					this.processOrder('stand', {});
				};
				// console.log(name, this.curFrameIndex);
			};
		}
	};

	var Chest = {
		friction: -4,
		box: {
			marginLeft: 0,
			marginRight: 0,
			marginUp: 8,
			marginDown: 0
		},

		init: function() {
			this.imgPos = [0, 64];
		},

		animate: function() {
			this.calculateCoor();
		},

		calculateCoor: function() {
			var // prePosition = this.prePosition,
				interGrid,
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
							// if (interGrid || interChest) {
							// 	// this.restorePosition(dir);
							// 	// this.speed = 0;
							// 	// game.man.restorePosition(dir);//can't not prevent overlap on the edge
							// }
							this.speed += this.friction;
							// this.prePosition.Y = this.Y;
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
							// if (interGrid || interChest) {
							// 	// this.restorePosition(dir);
							// 	// this.speed = 0;
							// 	// game.man.restorePosition(dir);//can't not prevent overlap on the edge
							// }
							this.speed += this.friction;
							// this.prePosition.Y = this.Y;
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
							// if (interGrid || interChest) {
							// 	// this.restorePosition(dir);
							// 	// this.speed = 0;
							// 	// game.man.restorePosition(dir);//can't not prevent overlap on the edge
							// }
							this.speed += this.friction;
							// this.prePosition.X = this.X;
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
							// if (interGrid || interChest) {
							// 	// this.restorePosition(dir);
							// 	// this.speed = 0;
							// 	// game.man.restorePosition(dir);//can't not prevent overlap on the edge
							// }
							this.speed += this.friction;
							// this.prePosition.X = this.X;
						} else {
							this.dir = '';
						};
						break;
				}
			}
		},

		processOrder: function(order, details) {
			switch (order) {
				case 'move':
					this.dir = details.dir;
					this.speed = details.distance;
					break;
				case 'inplace':
					break;
			}
		},
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