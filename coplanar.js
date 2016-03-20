


var worker = new Worker('coplanarworker.js'); 
// in main js file
worker.onmessage = function(e) {  
  var data = e.data;
  if (data.type === 'debug') {
    console.log(data.value);
  }
  else if (data.type === 'result') {
    // process results
  }
}

worker.postMessage({
	data: "hi there"
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
    var coords = entry.split("),(");
    if (coords.length < 2) {
        coords = entry.split(")(");
    }
    coords.forEach(function (c) {
        c = "(" + c + ")";
        names.forEach(function (name, i) {
            if (name == c)
                selectVertex(i);
        });
    });

	colors.needsUpdate = true;
    updateCalculations();
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
    for (var i = index.length-1; i >= 0; i--) {
    	if (index[i] == 2)
    		index[i] = 0;
    	setColor(i);
    }

    // Show connecting lines
    // removeChildren(connectorgroup);
    if (selected.length < 2)
        return true;
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

    params.moves = '' + highlightInvalidPoints(selected);

    if (!isCoplanar(selected, true)) {
        params.solution = '' + selected.length;
    }
    updateGUI();

}

function highlightInvalidPoints(selected) {

    if (selected.length < 3)
        return '';

    var count = 0;
    var cs = Combinatorics.bigCombination(selected, 3);
    var abc = null;
    while(abc = cs.next()) {
        var parts = detparts(
        	abc[0], 
        	abc[1], 
        	abc[2]
        );
        for (var i = index.length-1; i >= 0; i--) {
            if (index[i] !== 0)
                continue;

            if (detlast(parts, i) === 0) {
            	index[i] = 2;
            	setColor(i);
                count++;
            }
        }
    }
    return index.length - count - selected.length;

}

function detlast(parts, p4) {
	var a = positions.array;
	var i4 = p4*3;
    var n41 = a[i4], n42 = a[i4 + 1], n43 = a[i4 + 2];

    return (
        n41 * parts[0] +
        n42 * parts[1] +
        n43 * parts[2] +
        parts[3]
    );
}

function detparts(p1, p2, p3) {

	var a = positions.array;
	var i1 = p1*3, i2 = p2*3, i3 = p3*3;

    var n11 = a[i1], n12 = a[i1 + 1], n13 = a[i1 + 2];
    var n21 = a[i2], n22 = a[i2 + 1], n23 = a[i2 + 2];
    var n31 = a[i3], n32 = a[i3 + 1], n33 = a[i3 + 2];

    return [
        (
             + n23 * n32
             - n13 * n32
             - n22 * n33
             + n12 * n33
             + n13 * n22
             - n12 * n23
        ),
        (
             + n11 * n23
             - n11 * n33
             + n21 * n33
             - n13 * n21
             + n13 * n31
             - n23 * n31
        ),
        (
             + n11 * n32
             - n11 * n22
             - n21 * n32
             + n12 * n21
             + n22 * n31
             - n12 * n31
        ),
        (
             - n13 * n22 * n31
             - n11 * n23 * n32
             + n11 * n22 * n33
             + n13 * n21 * n32
             - n12 * n21 * n33
             + n12 * n23 * n31
        )
    ];
}




function determinant(p1, p2, p3, p4) {

	var a = positions.array;
	var i1 = p1*3, i2 = p2*3, i3 = p3*3;

    var n11 = a[i1], n12 = a[i1 + 1], n13 = a[i1 + 2];
    var n21 = a[i2], n22 = a[i2 + 1], n23 = a[i2 + 2];
    var n31 = a[i3], n32 = a[i3 + 1], n33 = a[i3 + 2];

	var i4 = p4*3;
    var n41 = a[i4], n42 = a[i4 + 1], n43 = a[i4 + 2];

    //TODO: make this more efficient
    //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

    return (
        n41 * (
            + n23 * n32
             - n13 * n32
             - n22 * n33
             + n12 * n33
             + n13 * n22
             - n12 * n23
        ) +
        n42 * (
            + n11 * n23
             - n11 * n33
             + n21 * n33
             - n13 * n21
             + n13 * n31
             - n23 * n31
        ) +
        n43 * (
            + n11 * n32
             - n11 * n22
             - n21 * n32
             + n12 * n21
             + n22 * n31
             - n12 * n31
        ) +
        (
            - n13 * n22 * n31
             - n11 * n23 * n32
             + n11 * n22 * n33
             + n13 * n21 * n32
             - n12 * n21 * n33
             + n12 * n23 * n31
        )

    );

}

function isCoplanar(selected, updateMaterial) {

    if (selected.length < 4)
        return false;

    var cs = Combinatorics.bigCombination(selected, 4);
    while(ab = cs.next()) {
        var d = determinant(
        	ab[0], 
        	ab[1], 
        	ab[2], 
        	ab[3]);
        if (d == 0) {
            if (updateMaterial) {
                ab.forEach(function(o) {
					colors.setXYZ(i, 0.5, 0, 0);
					index[i] = 4;
					setColor(i);
                    // colors[o] o.material = selectedBadMaterial;
                });
            }
            return true;
        }
    }

    return false;

}