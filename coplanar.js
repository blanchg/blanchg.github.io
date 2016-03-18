
function round(v) {
    return Math.round(v * 100) / 100;
}

function vStr(v) {
    return "(" + round(v.x) + ", " + round(v.y) + ", " + round(v.z) + ")";
}

function xyzStr(x,y,z) {
    return "(" + round(x) + ", " + round(y) + ", " + round(z) + ")";
}

function name(i) {
	return names[i];
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