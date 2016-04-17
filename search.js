importScripts('combinatorics.js');
importScripts('det.js');


var positions;
var n;

// in worker.js
self.addEventListener('message', function(e) {

  var data = e.data;
  if (data.type === 'update') {
    console.log("Positions updated in search worker");
    positions = e.data.positions;
  }
  if (data.type === 'search') {
  	n = data.n;
    var result = randomSearch();
    // console.log("Calculated result", result);
    self.postMessage({
      type: 'results',
      data: result
    });
  }

});

// setTimeout(function() {
// 	console.log("Timed out stopping search");
// 	running = false;
// }, 20000);

// Theory
// Number of layers with 3 points = Math.ceil(n/2)

function layerSlice(layer, layerSize) {
	var slice = [];
	var start = layerSize * layer;
	var end = layerSize * layer + layerSize;
	for (var i = 0, j = start; j < end; i++, j++) {
		slice[i] = j;
	}
	return slice;
}

function randomSearch() {
	// setGridSize(11);

	var threes = Math.ceil(n/2);
	var twos = n - threes;
	var theory = threes*3 + twos*2;

	var index = new Array(n*n*n);
	var options = [];
	var best = [];
	var bestIndex = [];
	var counter = 0;

	while (best.length < theory) {
		options.length = index.length;
		for (var i = 0; i < index.length; i++) {
			index[i] = 0;
			options[i] = i;
		}
		// console.log("initialized", n);
		var selected = findStart(index, options)
		// console.log("Starting from", selected.map(name).join(','));
		// for (var i = 0; i < selected.length; i++) {
		// 	options.splice(selected[i], 1);
		// }
		options = validateSlice(index, options, selected);
		// console.log("Searching");
		while (options.length > 0) {
			var bestChoice = {index: index, selected: selected, options: null};
			for (var i = 0; i < options.length; i++) {
				var choice = {
					index: index.concat(),
					option: options[i],
					selected: selected.concat()
				};
				choice.selected.push(options[i]);
				choice.options = validateSlice(choice.index, options, choice.selected);
				if (bestChoice.options == null) {
					bestChoice = choice;
				} else if (choice.options.length > bestChoice.options.length) {
					bestChoice = choice;
				} else if (choice.options.length == bestChoice.options.length && Math.random() > 0.5) {
					bestChoice = choice;
				}
			}
			index = bestChoice.index;
			options = bestChoice.options;
			selected = bestChoice.selected;

			// console.log("To go", options.length);
			for (var i = 0; i < selected.length; i++) {
				index[selected[i]] = 1;
			}
		    self.postMessage({
		      type: 'progress',
		      data: {
		      	index: index,
		      	moves: options.length,
				selected: selected.length
		      }
		    });
			// var i = Math.floor(Math.random() * options.length);
			// var next = options[i];
			// selected.push(next);
			// Cut out the invalid ones
			// options = validateSlice(index, options, selected);
		}

		// console.log(selected.length);

		if (selected.length > best.length) {
			best = selected;
			bestIndex = index;
		}
		// console.log("Found", best.length + '/' +  theory, best.map(name).join(","));

		// break;
		counter++;
	}

	// var entry = best.map(name).join(',');
	// console.log("Best", best.length, entry);

	// displayEntry(entry);
	for (var i = 0; i < best.length; i++) {
		bestIndex[best[i]] = 1;
	}

	return {
		index: bestIndex,
		moves: 0,
		selected: best.length
	};

}

function findStart(index, options) {
	var selected = [];//[names.indexOf('(0,0,0)'), names.indexOf('(1,0,0)')];
	while (selected.length < 3) {
		var i = Math.floor(Math.random() * options.length);
		// console.log(i);
		var next = options[i];
		if (selected.indexOf(next) == -1) {
			selected.push(next);
		}
	}
	return selected;
}

function validateSlice(index, slice, selected) {
	if (selected.length < 3) {
		return slice;
	}

	var cs = Combinatorics.bigCombination(selected, 3);
  	var abc = null;

	var valid = slice.filter(function(d) { return index[d] === 0; });
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

	return valid;

}

// setTimeout(search, 100);