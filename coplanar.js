
var worker = new Worker('coplanarworker.js'); 
// in main js file
worker.onmessage = function(e) {

  var data = e.data;
  if (data.type === 'results') {
  	// console.log("Received results", data.data.index);
    var newIndex = data.data.index;
    for (var i = newIndex.length - 1; i >= 0; i--) {
    	if (index[i] != newIndex[i]) {
    		index[i] = newIndex[i];
    		setColor(i);
    	}
    }
    params.moves = data.data.moves;
	colors.needsUpdate = true;
    params.thinking = false;
    updateGUI();
  }
}

// worker.postMessage({
// 	index: index,
// 	selected: selected,
// 	positions: positions
// });

window.addEventListener('gridChanged', function (e) {
    worker.postMessage({
    	type: 'update',
    	positions: positions.array
    });
    searchWorker.postMessage({
    	type: 'update',
    	positions: positions.array,
    	names: names
    });
});


function round(v) {
    return Math.round(v * 100) / 100;
}

function vStr(v) {
    return "(" + round(v.x) + ", " + round(v.y) + ", " + round(v.z) + ")";
}

function xyzStr(x,y,z) {
    return "(" + round(x) + "," + round(y) + "," + round(z) + ")";
}

function name(i) {
	return names[i];
}

function displayEntry(entry) {

    clearAll();

    entry = entry.replace(/[ ;]/g,'').slice(1,-1);
    console.log("Removed semicolon and spaces and start/end brackets");
    var coords = entry.split("),(");
    console.log("Tried to split the preferred way");
    if (coords.length < 2) {
        coords = entry.split(")(");
        console.log("Tried to split another way");
    }
    console.log("Selecting the vertices");
    var pMax = 0;
    coords.forEach(function (c) {
    	var points = c.split(",");
    	points.forEach(function(p) {
    		p = parseInt(p);
    		if (p > pMax) {
    			pMax = p;
    		}
    	});
    });
    pMax = pMax + 1;
    if (n < pMax) {
	    console.log("Setting grid size to", pMax);
	    setGridSize(pMax);
	}

    coords.forEach(function (c) {
        c = "(" + c + ")";
        var result = names.some(function (name, i) {
            if (name == c) {
                index[i] = 1;
				setColor(i);
                selected.push(i);//selectVertex(i);
                return true;
            }
        });

        if (!result) {
            console.error("Could not find point", c);
        }
    });

    // test1();

    if (!validateSelection(getSelected())) {
        return;
    }

    console.log("Updating the calculations");
    // return;
	// colors.needsUpdate = true;
    updateCalculations();
}


function test1() {
    var p = [24, 63, 5, 29, 60, 4, 56, 41, 3, 50, 46, 2];
    var result = determinant(p, 0, 1, 2, 3);
    console.log("Det test", result);
    if (result === 0)
        console.log("Points are coplanar in test");
}



function validateSelection(selected) {
  
  var cs = Combinatorics.bigCombination(selected, 4);
  var abcd = null;

  while (abcd = cs.next()) {
    // console.log(abcd);
    if(determinant(positions.array, abcd[0], abcd[1], abcd[2], abcd[3]) === 0) {
        console.error("These points are coplanar:", abcd.map(name));
        return false;
    }
  }
  console.log("No points coplanar");
  return true;
}


document.addEventListener('copy', function(e) {
    e.preventDefault();
    var textToPutOnClipboard = getSelected().map(name).join(",");
    // if (isIe) {
    //     window.clipboardData.setData('Text', textToPutOnClipboard);    
    // } else {
        e.clipboardData.setData('text/plain', textToPutOnClipboard);
    // }
});

document.addEventListener('paste', function(e) {
    e.preventDefault();

    e.clipboardData.items[0].getAsString(function(data) { 
    	displayEntry(data);
    });
});



function updateCalculations() {

    // var selected = targetList.filter(function(o) {
    //     o.visible = true;
    //     o.scale.x = normalScale;
    //     o.scale.y = normalScale;
    //     o.scale.z = normalScale;
    //     if (o.material === invalidMaterial)
    //         o.material = emptyMaterial;
    //     if (o.material === selectedBadMaterial)
    //         o.material = selectedMaterial;
    //     return o.material === selectedMaterial;
    // });

    // Show connecting lines
    // removeChildren(connectorgroup);
    // if (selected.length < 3)
    //     return true;
    // var cs = combinations(selected, 2);
    // for (var i = 0; i < cs.length; i++) {
    //     var ab = cs[i]
    //     var geometry = new THREE.Geometry();
    //     var a = ab[0];
    //     var b = ab[1];
    //     var distance = 0.3;

    //     var a1 = getPointInBetweenByLen(a.position, b.position, distance);
    //     var b1 = getPointInBetweenByLen(b.position, a.position, distance);

    //     geometry.vertices.push(
    //         a1,
    //         b1
    //     );
    //     geometry.computeLineDistances();
    //     var object = new THREE.LineSegments( geometry, lineMaterial );
    //     object.name = a.name + " - " + b.name;
    //     connectorgroup.add(object);
    // }

    // params.moves = '' + highlightInvalidPoints(selected);

    params.thinking = true;
    worker.postMessage({
    	type: 'results',
    	selected: selected, 
    	index: index
    });

    // Assume that only non co planar points can be selected...
    // if (!isCoplanar(selected, true)) {
        params.solution = '' + selected.length;
    // }
    updateGUI();

}

var searchWorker = new Worker('search.js'); 

var best = 0;

function randomSearch() {
	best = 0;
	searchWorker.postMessage({
		type: 'search',
		n: n
	});
}

searchWorker.onmessage = function(e) {

  var data = e.data;
  switch (data.type) {

  	case 'results':
	  	// console.log("Received results", data.data.index);
	    var newIndex = data.data.index;
	    selected.length = 0;
	    for (var i = newIndex.length - 1; i >= 0; i--) {
	    	if (index[i] != newIndex[i]) {
	    		index[i] = newIndex[i];
	    		setColor(i);
	    	}
	    	if (index[i] == 1)
	    		selected.push(i);
	    }
	    params.solution = data.data.selected;
	    params.moves = data.data.moves;
		colors.needsUpdate = true;
	    params.thinking = false;
	    updateGUI();
	    if (params.solution > best) {

			var threes = Math.ceil(n/2);
			var twos = n - threes;
			var theory = threes*3 + twos*2;
	    	best = params.solution;
            var entry = getSelected().map(name).join(",");
			console.log("Found", params.solution + '/' +  theory, entry);
            document.title = "" + n + " = " + params.solution + '/' +  theory;
            localStorage.setItem("" + n, entry)
            localStorage.setItem("" + n + "size", selected.length)
	    }
  		break;

  	case 'progress':
	  	// console.log("Received results", data.data.index);
	    var newIndex = data.data.index;
	    selected.length = 0;
	    for (var i = newIndex.length - 1; i >= 0; i--) {
	    	if (index[i] != newIndex[i]) {
	    		index[i] = newIndex[i];
	    		setColor(i);
	    	}
	    	if (index[i] == 1)
	    		selected.push(i);
	    }
	    params.solution = data.data.selected;
	    params.moves = data.data.moves;
		colors.needsUpdate = true;
	    params.thinking = false;
	    updateGUI();
	    if (params.solution > best) {

			var threes = Math.ceil(n/2);
			var twos = n - threes;
			var theory = threes*3 + twos*2;
	    	best = params.solution;
            var entry = getSelected().map(name).join(",");
            console.log("Found", params.solution + '/' +  theory, entry);
            document.title = "" + n + " = " + params.solution + '/' +  theory;
            localStorage.setItem("" + n, entry)
            localStorage.setItem("" + n + "size", selected.length)
	    }
  		break;

  }
}