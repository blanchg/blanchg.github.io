importScripts('combinatorics.js');
importScripts('det.js');


var positions;
var n;
var names;

// in worker.js
self.addEventListener('message', function(e) {

  var data = e.data;
  if (data.type === 'update') {
    console.log("Positions updated in search worker");
    positions = e.data.positions;
    names = e.data.names;
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

function testOption(i, index, options, selected, bestChoice) {
	var choice = {
		index: index.concat(),
		option: options[i],
		selected: selected.concat()
	};
	choice.selected.push(options[i]);
	choice.options = validateSlice(choice.index, options, choice.selected);
	choice.size = choice.options.length;
	if (choice.size > bestChoice.size) {
		bestChoice = choice;
	} else if (choice.size == bestChoice.size) {
		if (Math.random() > 0.5)
			bestChoice = choice;
	}
	return bestChoice;
}

function name(i) {
	return names[i];
}

function randomSearch() {
	// setGridSize(11);

	console.log("Search started");

	var threes = Math.ceil(n/2);
	var twos = n - threes;
	var theory = threes*3 + twos*2;

	var index = new Array(n*n*n);
	var options = [];
	var best = [];
	var bestIndex = [];
	var counter = 0;
	options.length = index.length;
	for (var i = 0; i < index.length; i++) {
		index[i] = 0;
		options[i] = i;
	}

	var initial = null;
	var startCmb = null;
	// if (n == 11) {
	// 	startCmb = Combinatorics.bigCombination(layerSlice(0, n*n), 2);
	// 	console.log("Search size:", startCmb.length);
	// 	for (var i = 0; i < 44; i++) {
	// 		initial = startCmb.next();
	// 	}
	// }

	while (best.length < theory) {
		options.length = index.length;
		for (var i = 0; i < index.length; i++) {
			index[i] = 0;
			options[i] = i;
		}
		// console.log("initialized", n);
		var selected = null;

		// if (startCmb == null) {
			selected = findStart(index, options);
		// } else {
		// 	counter++;
		// 	selected = initial; //startCmb.next();
		// 	if (selected == null)
		// 		break;

		// 	selected = findStart(index, options, selected);
		// 	console.log(counter + "/" + startCmb.length);
		// }
		// console.log("Starting from", selected.map(name).join(','));
		// for (var i = 0; i < selected.length; i++) {
		// 	options.splice(selected[i], 1);
		// }
		options = validateSlice(index, options, selected);

		if (options.length == 0)
			continue;

		selected = deepSearch(index, options, selected);

		// console.log(selected.length);

		if (selected.length > best.length) {
			best = selected;
			// bestIndex = index;
		}
		// console.log("Found", best.length + '/' +  theory, best.map(name).join(","));

		// break;
		// counter++;
	}

	// var entry = best.map(name).join(',');
	// console.log("Best", best.length, entry);

	console.log("CONGRATULATIONS!!! FINISHED SEARCHING!");

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

function deepSearch(index, options, selected) {

	// console.log('o',options.length,'s',selected.length);
	// console.log("Searching");
	while (options.length > 0) {

		var bestChoice = {index: index, selected: selected, options: null, size: -1};
		if (false) {
			var choices = [];
			for (var i = 0; i < options.length; i++) {
				var choice = testOption(i, index, options, selected, bestChoice);
				if (choice.size > bestChoice.size) {
					choices = [choice];
				} else if (choice.size == bestChoice.size) {
					choices.push(choice);
				}
				bestChoice = choice;
			}

			// console.log("There are", choices.length, "options out of", options.length);
			if (choices.length == 1) {
				index = bestChoice.index;
				options = bestChoice.options;
				selected = bestChoice.selected;
			} else {
				for (var i = 0; i < choices.length; i++) {
					var choice = choices[i];
					var choiceSelected = deepSearch(choice.index, choice.options, choice.selected);
					if (choiceSelected.length > selected.length) {
						// console.log("L",choiceSelected.length);
						selected = choiceSelected;
					}
				}
				return selected;
			}


		} else {
			if (options.length > 1000) {
				for (var j = 0; j < 30; j++) {
					var i = Math.floor(Math.random() * options.length);
					bestChoice = testOption(i, index, options, selected, bestChoice);
				}
			} else {
				var target = options.length - 1;
				for (var i = 0; i < options.length; i++) {
					bestChoice = testOption(i, index, options, selected, bestChoice);
					if (bestChoice.options.length == target) {
						break;
					}
				}
			}
			index = bestChoice.index;
			options = bestChoice.options;
			selected = bestChoice.selected;
		}

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

	return selected;
}

function findStart(index, options, selected) {
	if (selected == null)
		selected = [];
	// return [names.indexOf('(0,0,0)'), names.indexOf('(1,1,0)'), names.indexOf('(' + (n-1) + ',' + (n-1) + ',' + (n-1) + ')')];
	while (selected.length < 2) {
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
	if (selected.length < 2) {
		return slice;
	}

	var valid = slice.filter(function(d) { return index[d] === 0; });
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
		return valid;
	}

	// Coplanar 4 points
	cs = Combinatorics.bigCombination(selected, 3);
  	var abc = null;
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