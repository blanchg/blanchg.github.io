var container, stats;

var camera, scene, renderer;

var axisgroup, gridgroup, connectorgroup, text, plane;

var axisHelper, axisHelper2;

var gridPointGeom;
var selectedMaterial;
var selectedBadMaterial;
var emptyMaterial;
var invalidMaterial;
var lineMaterial;
var mouse = { x: 0, y: 0 };
var raycaster;
var targetList = [];

var targetRotationX = -0.1;
var targetRotationOnMouseDownX = 0;

var targetRotationY = 0.25;
var targetRotationOnMouseDownY = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var mouseY = 0;
var mouseYOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var finalRotationY;

var normalScale = 0.2;
var badScale = 0.1;

var size = 2;
var maxDistance = Math.sqrt(3) * size;
console.log("maxDistance", maxDistance);

var powerSearch = null;
var bestLength = 0;
var best = null;
var timing;

init();
drawGrid(size);
animate();
var b = null;
var c = Combinatorics.combination([1,2,3,4,5,6,7,8,9], 8);
var c2 = Combinatorics.bigCombination([1,2,3,4,5,6,7,8,9], 8);
while ((b = c.next()) && (b2 = c2.next())) {
    if (b.join("") != b2.join(""))
        console.log("Error:",b.join(""), b2.join(""));
}

var gui = new dat.GUI({
    height : 1 * 32 - 1
});
var params = {
    size: size,
    solution: '0',
    moves: ''
};

gui.add(params, 'size').min(2).max(97).step(1).name('N').onFinishChange(function(value) {
    value = parseInt(value);
    if (value > 97)
        return;
  drawGrid(value);
});

// gui.add(params, 'run').name('Search');
// gui.add(params, 'stop').name('Stop');
// gui.add(params, 'entry').name('Print Entry');
gui.add(params, 'solution').name('Solution Size');
gui.add(params, 'moves').name('Valid Moves');
// gui.add(params, 'submitEntry').name('View Entry');


function init() {
    
    
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );

        camera.up = new THREE.Vector3(0,1,0);
        // camera.position.x = 5;
        // camera.position.y = 5;
        camera.position.z = 5;

        camera.lookAt(new THREE.Vector3(0,0,0));

        scene = new THREE.Scene();

        // lights

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        light = new THREE.DirectionalLight( 0x002288 );
        light.position.set( -1, -1, -1 );
        scene.add( light );

        light = new THREE.AmbientLight( 0x222222 );
        scene.add( light );

        // gridPointGeom = new THREE.SphereGeometry(0.1, 2, 2);

        selectedMaterial = new THREE.SpriteMaterial( { color: 0x000088 });
        selectedBadMaterial = new THREE.SpriteMaterial( { color: 0xaa0088 });
        emptyMaterial = new THREE.SpriteMaterial( { color: 0x00ee00 });
        invalidMaterial = new THREE.SpriteMaterial( { color: 0xdd0000 });
        lineMaterial = new THREE.LineBasicMaterial( { color: 0xffaa00, linewidth: 1 } );

        // // texture - texture must not be in same folder or there is an error.
        // var texture = THREE.ImageUtils.loadTexture( 'images/texture.jpg', {}, function(){ 
        // // use to test when image gets loaded if it does
        // render();
        // }, 
        // function(){ 
        //     alert('error') 
        // });
        
        //alert('WORKING');

        // create the sphere's material
        // material = new THREE.MeshLambertMaterial(
        // {
        //     color: 0xCC0000
        // });


        // material = new THREE.MeshPhongMaterial({map: texture});

        axisgroup = new THREE.Object3D();
        scene.add( axisgroup );
        gridgroup = new THREE.Object3D();
        scene.add( gridgroup );
        connectorgroup = new THREE.Object3D();
        scene.add( connectorgroup );
         
        //load mesh 
        // var loader = new THREE.JSONLoader();
        // loader.load('models/cube.js', modelLoadedCallback);

        axisHelper = new THREE.AxisHelper(6000);
        axisHelper.rotation.x = Math.PI/2;
        // axisHelper.rotation.z = Math.PI/2;
        axisHelper2 = new THREE.AxisHelper(6000);
        axisgroup.add(axisHelper);
        axisHelper2.scale.x = -1;
        axisHelper2.scale.y = -1;
        axisHelper2.scale.z = -1;
        axisHelper2.rotation.x = Math.PI/2;
        // axisHelper2.rotation.z = Math.PI/2;
        axisgroup.add(axisHelper2);

        raycaster = new THREE.Raycaster();

        // renderer

        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setSize( window.innerWidth, window.innerHeight );

        container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild( stats.domElement );

        container.addEventListener( 'mousedown', onDocumentMouseDown, false );
        // container.addEventListener( 'mousemove', onDocumentMouseMove, false );
        container.addEventListener( 'mouseup', onDocumentMouseUp, false );
        container.addEventListener( 'touchstart', onDocumentTouchStart, false );
        container.addEventListener( 'touchmove', onDocumentTouchMove, false );
        container.addEventListener( 'mousewheel', onDocumentMouseWheel, false);

        //

        window.addEventListener( 'resize', onWindowResize, false );
        
        //for debuging stats
        // interval = setInterval( debugInfo, 50 );

}

function selectOption(option) {
    // clear the vertices
    targetList.forEach(function(o) {
        clearVertex(o);
    });

    // set all the options
    option.forEach(function(o) {
        selectVertex(o);
    });
}

function stopSearch() {
    powerSearch = {
        next: function() { return null; }
    };
}

function searchForBest() {
    timing = performance.now();
    bestLength = 0;
    best = null;
    powerSearch = Combinatorics.power(targetList);
    stepSearch();

}

function endSearch() {
    console.log("Time: ", (performance.now() - timing), "ms");
    console.log("Found best", bestLength, best.map(function(o) { return o.name; }).join(", "));
    selectOption(best);
    updateCalculations();
}


function stepSearch() {

    var option;

    for (var i = 0; i < 5000; i++) {

        option = powerSearch.next();
        if (!option) {
            endSearch();
            return;
        }

        // if this option is shorter or equal than previous best skip
        if (option.length <= bestLength)
            continue;

        // test the option
        if (isCoplanar(option, false)) {
            bestLength = option.length;
            best = option;
            console.log("Progress", bestLength, best.map(function(o) { return o.name; }).join(", "));
        }
    }

    // if (option) {
    //     selectOption(option);
    //     updateCalculations();
    // }

    setTimeout(stepSearch, 5);

}

function removeChildren(group) {
    if (group.children.length == 0)
        return;

    for (var i = group.children.length - 1; i >= 0; i--) {
        group.remove(group.children[i])
    }

}

function drawGrid(size) {
    // Clear out scene first except for the axis helpers
    removeChildren(gridgroup);

    removeChildren(connectorgroup);

    targetList.length = 0;
    var half = (size-1)/2;

    for (var z = 0; z < size; z++) {
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                // var gridPoint = new THREE.Mesh( gridPointGeom, emptyMaterial );
                var gridPoint = new THREE.Sprite( emptyMaterial );
                gridPoint.scale.x = normalScale;
                gridPoint.scale.y = normalScale;
                gridPoint.scale.z = normalScale;
                gridPoint.name = "(" + [x,y,z].join(",") + ")";
                gridPoint.position.set(x-half, y-half, z-half);
                gridgroup.add(gridPoint);
                targetList.push(gridPoint);
            }
        }
    }

}

function round(v) {
    return Math.round(v * 100) / 100;
}

function vStr(v) {
    return "(" + round(v.x) + ", " + round(v.y) + ", " + round(v.z) + ")";
}

function name(o) {
    return o.name;
}

function getPointInBetweenByLen(pointA, pointB, length) {

    var dir = pointB.clone().sub(pointA).normalize().multiplyScalar(length);
    return pointA.clone().add(dir);

}

function getSelected() {
    return targetList.filter(function(o) {
        return o.material === selectedMaterial;
    });
}

function entry() {
    console.log("Entry:", getSelected().map(name).join(","));
    params.submit = getSelected().map(name).join(",");

      // Iterate over all controllers
      for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
      }
}

document.addEventListener('copy', function(e) {
    var textToPutOnClipboard = getSelected().map(name).join(",");
    // if (isIe) {
    //     window.clipboardData.setData('Text', textToPutOnClipboard);    
    // } else {
        e.clipboardData.setData('text/plain', textToPutOnClipboard);
    // }
    e.preventDefault();
});
document.addEventListener('paste', function(e) {
    // var textToPutOnClipboard = getSelected().map(name).join(",");
    // if (isIe) {
    //     window.clipboardData.setData('Text', textToPutOnClipboard);    
    // } else {
        // e.clipboardData.setData('text/plain', textToPutOnClipboard);
    // }
    e.clipboardData.items[0].getAsString(function(data) { displayEntry(data)});
    e.preventDefault();
});

function submitEntry() {
    displayEntry(params.submit);
}

function clearAll() {
    targetList.forEach(function (o) {
        clearVertex(o);
    })
    removeChildren(connectorgroup);
}

function displayEntry(entry) {

    clearAll()
    entry = entry.replace(/[ ;]/g,'').slice(1,-1);
    var coords = entry.split("),(");
    if (coords.length < 2) {
        coords = entry.split(")(");
    }
    coords.forEach(function (c) {
        c = "(" + c + ")";
        targetList.forEach(function (o) {
            if (o.name == c)
                selectVertex(o);
        });
    });
    updateCalculations();
}

function updateCalculations() {

    var selected = targetList.filter(function(o) {
        o.visible = true;
        o.scale.x = normalScale;
        o.scale.y = normalScale;
        o.scale.z = normalScale;
        if (o.material === invalidMaterial)
            o.material = emptyMaterial;
        if (o.material === selectedBadMaterial)
            o.material = selectedMaterial;
        return o.material === selectedMaterial;
    });

    // Show connecting lines
    removeChildren(connectorgroup);
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

    if (isCoplanar(selected, true)) {
        params.solution = '' + selected.length;
        updateGUI();
        return true;
    } else {
        updateGUI();
        return false;
    }

}

function updateGUI() {
      // Iterate over all controllers
      for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
      }

}

function highlightInvalidPoints(selected) {

    if (selected.length < 3)
        return '';

    // var remainder = targetList.filter(function(o) {
    //     return selected.indexOf(o) != -1;
    // });
    var count = 0;
    // var sj = selected.join(",");
    var cs = Combinatorics.bigCombination(selected, 3);
    // console.log(cs);
    var abc = null;
    while(abc = cs.next()) {
        var parts = detparts(abc[0].position, abc[1].position, abc[2].position);
        for (var i = targetList.length-1; i >= 0; i--) {
            var p4 = targetList[i];
            if (p4.material !== emptyMaterial)
                continue;

            if (detlast(parts, p4.position) === 0) {
                p4.material = invalidMaterial;
                p4.scale.x = badScale;
                p4.scale.y = badScale;
                p4.scale.z = badScale;
                p4.visible = false;
                count++;
            }
            // p4.scale.x = 2;
            // p4.scale.y = 2;
            // p4.scale.z = 2;
        }
    }
    return targetList.length - count - selected.length;

}

function detlast(parts, p4) {
    var n41 = p4.x, n42 = p4.y, n43 = p4.z;

    return (
        n41 * parts[0] +
        n42 * parts[1] +
        n43 * parts[2] +
        parts[3]
    );
}

function detparts(p1, p2, p3) {

    var n11 = p1.x, n12 = p1.y, n13 = p1.z;
    var n21 = p2.x, n22 = p2.y, n23 = p2.z;
    var n31 = p3.x, n32 = p3.y, n33 = p3.z;

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

    var n11 = p1.x, n12 = p1.y, n13 = p1.z;
    var n21 = p2.x, n22 = p2.y, n23 = p2.z;
    var n31 = p3.x, n32 = p3.y, n33 = p3.z;
    var n41 = p4.x, n42 = p4.y, n43 = p4.z;

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
        return true;

    var cs = Combinatorics.bigCombination(selected, 4);
    // var matrix = new THREE.Matrix4();
    while(ab = cs.next()) {
        // matrix.set(
        //     ab[0].position.x, ab[0].position.y, ab[0].position.z, 1,
        //     ab[1].position.x, ab[1].position.y, ab[1].position.z, 1,
        //     ab[2].position.x, ab[2].position.y, ab[2].position.z, 1,
        //     ab[3].position.x, ab[3].position.y, ab[3].position.z, 1
        // );
        // var d = matrix.determinant();
        var d = determinant(ab[0].position, ab[1].position, ab[2].position, ab[3].position);
        // console.log("Determinant:", d, ab.map(function(o){return o.position}).map(vStr));
        if (d == 0) {
            if (updateMaterial) {
                // console.log("Coplanar", ab);
                ab.forEach(function(o) {
                    o.material = selectedBadMaterial;
                });
            }
            return false;
        }
    }

    return true;

}

// function modelLoadedCallback(geometry) {

//         // mesh = new THREE.Mesh( geometry, material );
//         // group.add(mesh);
//         scene.add( group );

// }

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseWheel( event) {
    camera.position.z += (camera.position.z / 10) * (event.deltaY / 100);
}

//

var mouseDown = false;
function onDocumentMouseDown( event ) {

    event.preventDefault();


    container.addEventListener( 'mousemove', onDocumentMouseMove, false );
    container.addEventListener( 'mouseup', onDocumentMouseUp, false );
    container.addEventListener( 'mouseout', onDocumentMouseOut, false );

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDownX = targetRotationX;
    
    mouseYOnMouseDown = event.clientY - windowHalfY;
    targetRotationOnMouseDownY = targetRotationY;
    mouseDown = true;

}

var mouseOver = null;
function onDocumentMouseMove( event ) {

    if (mouseDown) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;


        targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.02;
        targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.02;
    }

    // if (!mouseDown) {
    //     mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.width ) * 2 - 1;
    //     mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.height ) * 2 + 1;
    //     raycaster.setFromCamera(mouse, camera);
    //     var intersects = raycaster.intersectObjects( targetList, true );
    //     // if there is one (or more) intersections
    //     if ( intersects.length > 0 )
    //     {
    //         // console.log("Hit @ ", intersects[0].point );
    //         // change the color of the closest face.
    //         // intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
    //         // intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
    //         // toggleVertex(intersects[0].object);
    //         if (mouseOver === intersects[0]) {
    //             // do nothing
    //         } else {
    //             mouseOver = intersects[0];
    //             renderer.domElement.title = mouseOver.object.name;
    //             selected = getSelected();
    //             if (selected.indexOf(mouseOver.object) == -1)
    //                 selected.push(mouseOver.object);
    //             if (isCoplanar(selected, false)) {
    //                 selectedMaterial.color.set(0x0000aa);
    //             } else {
    //                 selectedMaterial.color.set(0xff0000);
    //             }
    //         }
    //     } else {
    //         mouseOver = null;
    //         renderer.domElement.title = "";
    //         selectedMaterial.color.set(0x0000aa);
    //     }
    // }

}

function onDocumentMouseUp( event ) {
    mouseDown = false;

    container.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    container.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    container.removeEventListener( 'mouseout', onDocumentMouseOut, false );


    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    // console.log("mouse up", mouseX, mouseY, mouseXOnMouseDown, mouseYOnMouseDown, targetList);

    // Click with drag so don't interact
    if (mouseX != mouseXOnMouseDown && mouseY != mouseYOnMouseDown) {
        // console.log("Dragged, not clicked");
        return;
    }

    mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.height ) * 2 + 1;
    // mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    // mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = raycaster.intersectObjects( targetList, true );
    
    // if there is one (or more) intersections
    if ( intersects.length > 0 )
    {
        // console.log("Hit @ ", intersects[0].point );
        // change the color of the closest face.
        // intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
        // intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
        toggleVertex(intersects[0].object)

        updateCalculations();
    }

}

function toggleVertex(v) {
    if (v.material === emptyMaterial || v.material === invalidMaterial) {
        selectVertex(v);
    } else {
        clearVertex(v);
    }
}

function selectVertex(v) {
    v.material = selectedMaterial;
    // v.scale.set(2,2,2);
}

function clearVertex(v) {
    v.material = emptyMaterial;
    // v.scale.set(1,1,1);
}

function onDocumentMouseOut( event ) {

    container.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    container.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    container.removeEventListener( 'mouseout', onDocumentMouseOut, false );

}

function onDocumentTouchStart( event ) {

    if ( event.touches.length == 1 ) {

        event.preventDefault();

        mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
        targetRotationOnMouseDownX = targetRotationX;
        
        mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
        targetRotationOnMouseDownY = targetRotationY;
            
            

    }

}

function onDocumentTouchMove( event ) {

    if ( event.touches.length == 1 ) {

        event.preventDefault();

        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        targetRotationX = targetRotationOnMouseDownX + ( mouseX - mouseXOnMouseDown ) * 0.05;
        
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
        targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.05;

    }

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {


    //horizontal rotation   
    axisgroup.rotation.y += ( targetRotationX - axisgroup.rotation.y ) * 0.1;

    //vertical rotation 
    finalRotationY = (targetRotationY - axisgroup.rotation.x); 

     
    if (axisgroup.rotation.x <= 1 && axisgroup.rotation.x >= -1) {

        axisgroup.rotation.x += finalRotationY * 0.1;
    }
    if (axisgroup.rotation.x > 1) {

        axisgroup.rotation.x = 1;
    }
    else if (axisgroup.rotation.x < -1) {

        axisgroup.rotation.x = -1;
    }


    gridgroup.rotation.y = axisgroup.rotation.y;
    connectorgroup.rotation.y = axisgroup.rotation.y;
    gridgroup.rotation.x = axisgroup.rotation.x;
    connectorgroup.rotation.x = axisgroup.rotation.x;

    renderer.render( scene, camera );

}

document.addEventListener('keyup', function(e) {
    if (e.keyCode == 27)
        clearAll();
})


// function debugInfo()
// {
//     $('#debug').html("mouseX : " + mouseX + "   mouseY : " + mouseY + "</br>")
   
// }