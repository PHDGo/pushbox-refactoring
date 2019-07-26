// Generate a level-obstructed-terrain.json file from the Tiled level.json file, for use in our game

var fs = require("fs"),
    arr = [0, 2, 3, 4, 5, 6];

arr.forEach(function(n){
    var room = "room" + n;
    fs.readFile(room + ".json", function(err, data) {
        if (err) {
            throw err;
        }
        processFile(data, room);
    });
})



function processFile(text, room) {
    // Get level data as a parsed JSON file
    var json = JSON.parse(text);

    var width = json.width;
    var height = json.height;


    // Store list of tiles with obstructed terrain
    var obstructed = [];
    var terrain = [];
    var chests = [];
    var rects = [];

    var shade = {};

    var map = {
        mapGridWidth: width,
        mapGridHeight: height,
        chests: chests,
        rects: rects,
        mapObstructedTerrain: obstructed,
        terrain: terrain,
        shade: shade,
    };

    // Iterate through tile data in layer and store any coordinates that have an obstruction
        //mapObstructedTerrain
    var data = json.layers[0].data;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var tile = data[y * width + x];

            if (tile >= 1 && tile <= 180){
                obstructed.push([x, y]);
            }
        }
    }

        //terrain
    for (var y = 0; y < height; y++) {
        var tempArr = [];
        for (var x = 0; x < width; x++) {
            tempArr.push(data[y * width + x]);
        };
        terrain.push(tempArr)
    }

        //rects
    var rectData = json.layers[1].data;
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            if (rectData[i * width + j] !== 0) {
                rects.push([j, i]);
            }
        }
    }

        //chests
    var chestData = json.layers[2].data;
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            if (chestData[i * width + j] !== 0) {
                chests.push([j, i]);
            }
        }
    }

        //shade
    for (var n = 3; n < json.layers.length; n++) {
        shade["shade"+(n-3)] = {};

        var layerData = json.layers[n].data;
        var shadeData = [];
        var tiles = [];
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var tile = layerData[y * width + x];
                if (tile > 0) {
                    shadeData.push([x, y]);
                }
            }
        }

        shade["shade"+(n-3)].shadeData = shadeData;

        for (var i = 0; i < height; i++) {
            var tempArr = [];
            for (var j = 0; j < width; j++) {
                tempArr.push(layerData[i * width + j])
            }
            tiles.push(tempArr);
        }

        shade["shade"+(n-3)].tiles = tiles;
    }

    // Write map data to map file
    fs.writeFile(room + "-mapData.json", JSON.stringify(map), function(err) {
        if (err) {
            throw err;
        }
        console.log(room + "obstructed terrain JSON generated.");
    });
}

