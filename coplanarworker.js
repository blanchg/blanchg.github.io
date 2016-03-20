importScripts('combinations.js');
// var console = {
//   log: log
// };

// in worker.js
self.addEventListener('message', function(e) {
  console.log("Received message", e.data)
  var result = highlightInvalidPoints(e.data.selected, e.data.index, e.data.positions);
  console.log("Calculated result", result);
  self.postMessage({
    type: 'results',
    data: result
  });

});

console.log("Worker is waiting for messages")

function highlightInvalidPoints(selected, index, positions) {

  if (selected.length < 3)
    return {
      index: index,
      moves: 0
    };

    
  for (var i = index.length-1; i >= 0; i--) {
    if (index[i] == 2)
      index[i] = 0;
    // setColor(i);
  }

  var count = 0;
  var cs = Combinatorics.bigCombination(selected, 3);
  var abc = null;
  while(abc = cs.next()) {
    var parts = detparts(positions,
      abc[0], 
      abc[1], 
      abc[2]
    );
    for (var i = index.length-1; i >= 0; i--) {
      if (index[i] !== 0)
        continue;

      if (detlast(positions, parts, i) === 0) {
        index[i] = 2;
        // setColor(i);
        count++;
      }
    }
  }
  return {
    index: index,
    moves: index.length - count - selected.length
  };

}

function detlast(positions, parts, p4) {
  var a = positions;
  var i4 = p4*3;
  var n41 = a[i4], n42 = a[i4 + 1], n43 = a[i4 + 2];

  return (
    n41 * parts[0] +
    n42 * parts[1] +
    n43 * parts[2] +
    parts[3]
  );
}

function detparts(positions, p1, p2, p3) {

  var a = positions;
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