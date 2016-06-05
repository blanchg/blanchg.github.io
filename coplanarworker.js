importScripts('combinatorics.js');
importScripts('det.js');
// var console = {
//   log: log
// };

var positions;

// in worker.js
self.addEventListener('message', function(e) {

  var data = e.data;
  if (data.type === 'update') {
    console.log("Positions updated in worker");
    positions = e.data.positions;
  }
  if (data.type === 'results') {
    var result = highlightInvalidPoints(data.selected, data.index, positions);
    // console.log("Calculated result", result);
    self.postMessage({
      type: 'results',
      data: result
    });
  }

});

console.log("Worker is waiting for messages")

var lastSelectedCount = 0;

function highlightInvalidPoints(selected, index, positions) {


  // Reset old invalid points
  if (lastSelectedCount > selected.length) {
    console.log("Resetting old invalid points");
    for (var i = index.length-1; i >= 0; i--) {
      if (index[i] == 2)
        index[i] = 0;
    }
  }
  lastSelectedCount = selected.length;


  if (selected.length < 2) {
    return {
      index: index,
      moves: index.length - 1
    };
  }

  var valid = index.map(function(d,i){ return (d == 0)?i:-1;}).filter(function(d) { return d !== -1; });
  // var valid = index.filter(function(d) { return index[d] === 0; });
  // Colinear 3 points
  var cs = Combinatorics.bigCombination(selected, 2);
  var ab = null;
  while(valid.length > 0 && (ab = cs.next())) {
    for (var j = valid.length-1; j >= 0; j--) {
      var i = valid[j];
      if (colinear(positions, ab[0], ab[1], i)) {
        index[i] = 2;
        valid.splice(j, 1);
      }
    }
  }

  if (selected.length < 3) {
    return {
      index: index,
      moves: valid.length
    };
  }

  cs = Combinatorics.bigCombination(selected, 3);
  var abc = null;

  // var valid = index.map(function(d,i){ return (d == 0)?i:-1;}).filter(function(d) { return d !== -1; });
  while(valid.length > 0 && (abc = cs.next())) {
    var parts = detparts(positions,
      abc[0], 
      abc[1], 
      abc[2]
    );
    for (var j = valid.length-1; j >= 0; j--) {
      var i = valid[j];
      if (detlast(positions, parts, i) === 0) {
        index[i] = 2;
        valid.splice(j, 1);
      }
    }
  }
  return {
    index: index,
    moves: valid.length
  };

}