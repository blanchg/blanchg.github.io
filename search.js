
var running = true;

params.search = randomSearch;

gui.add(params, 'search').name('Do Search');


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
		console.log("Searching");
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

			console.log("To go", options.length);
			// var i = Math.floor(Math.random() * options.length);
			// var next = options[i];
			// selected.push(next);
			// Cut out the invalid ones
			// options = validateSlice(index, options, selected);
		}

		console.log(selected.length);

		if (selected.length > best.length) {
			best = selected;
		}
		console.log("Found", best.length + '/' +  theory, best.map(name).join(","));

		// break;
		counter++;
	}

	var entry = best.map(name).join(',');
	console.log("Best", best.length, entry);

	displayEntry(entry);

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

function validateNext(index, selected, option) {

	var cs = Combinatorics.bigCombination(selected, 3);
  	var abc = null;

	while(abc = cs.next()) {
		var parts = detparts(positions.array,
			abc[0], 
			abc[1], 
			abc[2]
		);
		if (detlast(positions.array, parts, option) === 0) {
			return false;
		}
	}
	return true;
}

function search() {

	// var n = 5;
	setGridSize(3);
	var index = new Array(n*n*n);
	for (var i = 0; i < index.length; i++) {
		index[i] = 0;
	}

	// Layer combinations
	var threes = Math.ceil(n/2);
	var twos = n - threes;
	var theory = threes*3 + twos*2;
	console.log("Threes/Twos", threes, twos,n);
	console.log("Postions:", positions);
	var layerSelections = new Array(n);
	for (var i = 0; i < n; i++) {
		layerSelections[i] = (i < threes)?3:2;
	}
	// layerSelections.push(0);
	console.log("Layer selections:", layerSelections);

	var lIndex = [];
	var layerPermutations = Combinatorics.permutation(layerSelections).lazyFilter(function (d) {
		var perStr = d.join(',');
		var perStrRev = d.reverse().join(',');
		if (lIndex.indexOf(perStr) == -1 && lIndex.indexOf(perStrRev) == -1) {
			lIndex.push(perStr);
			return true;
		}
	});
	while (layerSelectNum = layerPermutations.next()) {
		console.log("layerSelectNum", layerSelectNum);
		var layerSize = n*n;
		var layerIndex = 0;
		deepSearch(index.concat(), layerSelectNum, layerSize, [], layerIndex, n, theory);
	}

	var entry = best.map(name).join(',');
	console.log("Best", bestSize, entry);

	displayEntry(entry);
}


var best = [];
var bestSize = 0;

function deepSearch(index, layerSelectNum, layerSize, selected, layerIndex, n, theory) {
	// console.log(layerIndex, selected);
	// if (layerIndex == n) {
		if (selected.length > bestSize) {
			best = selected;
			bestSize = selected.length;
			console.log("Best", bestSize, best, best.map(name).join(','));
		}
		// if (selected.length == bestSize) {
		// 	best.push(selected);
		// 	// console.log("NEW BEST", best, bestSize);
		// }
		// return;
	// }

	if (!running || bestSize == theory)
		return;

	var slice = layerSlice(layerIndex, layerSize);
	slice = validateSlice(index, slice, selected);
	// console.log(layerIndex, "validated slice", slice);
	var option = null;
	if (slice.length < layerSelectNum[layerIndex]) {
		// var result = selected.concat(slice);
		// deepSearch(index, layerSelectNum, layerSize, result, layerIndex+1, n);
		//  we could keep searching here but my theory is that this is less than optimum
		return;
	} else {
		var comb = Combinatorics.bigCombination(slice, layerSelectNum[layerIndex]);
		console.log("Length", layerIndex, comb.length);
		while (option = comb.next()) {
			// console.log("Option", option);
			// validate this combination with the selected
			if (validateOption(index, option, selected)) {
				deepSearch(index.concat(), layerSelectNum, layerSize, selected.concat(option), layerIndex+1, n, theory);
			}
		}
	}
}

function validateOption(index, option, selected) {
	if (selected.length < 2) {
		return true
	} else if (selected.length == 2) {
		// return true;

		var cs = Combinatorics.bigCombination(selected.concat(option), 4);
		var abcd = null;
		while (abcd = cs.next()) {
			if (determinant(positions.array, abcd[0], abcd[1], abcd[2], abcd[3]) === 0)
				return false;
		}
	} else {
		selected = selected.concat();
		for (var i = 0; i < option.length; i++) {
			selected.push(option[i]);
			var cs = Combinatorics.bigCombination(selected, 3);
  			var abc = null;
  			while (abc = cs.next()) {
				var parts = detparts(positions.array,
					abc[0], 
					abc[1], 
					abc[2]
				);
				for (var j = i; j < option.length; j++) {
					var k = option[j];
					if (detlast(positions.array, parts, k) === 0) {
						return false;
					}
				}

  			}

		}
	}

	return true;
}

function validateSlice(index, slice, selected) {
	if (selected.length < 3) {
		return slice;
	}

	var cs = Combinatorics.bigCombination(selected, 3);
  	var abc = null;

	var valid = slice.filter(function(d) { return index[d] === 0; });
	while(valid.length > 0 && (abc = cs.next())) {
		var parts = detparts(positions.array,
			abc[0], 
			abc[1], 
			abc[2]
		);
		for (var j = valid.length-1; j >= 0; j--) {
			var i = valid[j];
			if (detlast(positions.array, parts, i) === 0) {
				index[i] = 2;
				valid.splice(j, 1);
			}
		}
	}

	return valid;

}

// setTimeout(search, 100);