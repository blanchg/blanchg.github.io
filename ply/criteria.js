if (typeof process !== 'undefined') {
    var Combinatorics = require('js-combinatorics');
}

let slopeWeight = 1;
let intersectWeight = 2;
let rowColWeight = 1;

// Area using shoelace formula
function area(points) {

    var left = 0;
    var right = 0;
    var length = points.length - 1;
    var p;
    var p2;
    for (var i = 0; i < length; i++) {
        p = points[i];
        p2 = points[i+1];
        left += p.x * p2.y;
        right += p2.x * p.y;
    }
    p = p2;
    p2 = points[0];
    left += p.x * p2.y;
    right += p2.x * p.y;
    var result = (left - right) * 0.5;
    if (result < 0) {
        return -result;
    } else {
        return result;
    }
}


function passSlopeCheck(points, doCount) {
    var count = 0;
    var length = points.length - 1;
    var p;
    var p2;
    var slopes = [];
    for (var i = 0; i < length; i++) {
        p = points[i];
        p2 = points[i+1];
        var slope = (p.x - p2.x) / (p.y - p2.y);
        if (slopes.includes(slope)) {
            if (!doCount) {
                return false;
            }
            count++
        }
        slopes.push(slope);
    }
    p = p2;
    p2 = points[0];
    var slope = (p.x - p2.x) / (p.y - p2.y);
    if (slopes.includes(slope)) {
        if (!doCount) {
            return false;
        }
        count++;
    }
    if (!doCount) {
        return true;
    }
    return count;
}

function Turn(p1, p2, p3) {
    a = p1.x; b = p1.y;
    c = p2.x; d = p2.y;
    e = p3.x; f = p3.y;
    A = (f - b) * (c - a);
    B = (d - b) * (e - a);
    return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0;
}

function isIntersect(p1, p2, p3, p4) {
    // console.log(Turn(p1, p3, p4), Turn(p2, p3, p4));
    // console.log(Turn(p1, p2, p3), Turn(p1, p2, p4));
    return (Turn(p1, p3, p4) != Turn(p2, p3, p4)) && (Turn(p1, p2, p3) != Turn(p1, p2, p4));
}

function passIntersectCheck(points, doCount) {
    var count = 0;
    var edges = points.edges;
    if (edges == null) {
        edges = [];
        var length = points.length - 1;
        for(var i = 0; i < length; i++) {
            edges.push([i, i+1]);
        }
        edges.push([length, 0]);
        poly.edges = edges;
    }
    // var edges = [];
    // var length = points.length - 1;
    // for(var i = 0; i < length; i++) {
    //     edges.push([points[i], points[i+1]]);
    // }
    // edges.push([points[length], points[0]]);
    // console.log("Edges", edges);

    // Not all edges no need to test edges next to each other...


    var cmb = Combinatorics.bigCombination(edges, 2);
    while(combo = cmb.next()) {
        // console.log("Combos", combo);
        let edge1 = [points[combo[0][0]], points[combo[0][1]]];
        let edge2 = [points[combo[1][0]], points[combo[1][1]]];

        if (edge1[1] === edge2[0]) {
            if (area([edge1[0], edge1[1], edge2[1]]) == 0) {
                if (!doCount) {
                    return false;
                }
                count++;
            }
        } else if (edge2[1] === edge1[0]) {
            if (area([edge2[0], edge2[1], edge1[1]]) == 0) {
                if (!doCount) {
                    return false;
                }
                count++;
            }
        } else if (isIntersect(edge1[0], edge1[1], edge2[0], edge2[1])) {
            if (!doCount) {
                return false;
            }
            count++;
        }
    }

    if (!doCount) {
        return true;
    }
    return count;
}

function passRowColCheck(points, doCount) {
    var count = 0;
    var rows = [];
    var cols = [];
    var length = points.length;
    for (var i = 0; i < length; i++) {
        var point = points[i];
        if (cols.includes(point.x) ||
            rows.includes(point.y)) {
            if (!doCount) {
                return false;
            }
            count++;
        }
        rows.push(point.y);
        cols.push(point.x);
    }
    if (!doCount) {
        return true;
    }
    return count;
}


function format(poly) {
    return poly.map((p) => '(' + p.x + ',' + p.y +')').join(',');
}

function scorePoly(poly, minimise, n) {
    var score = {
        val: 0,
        area: 0,
        slope: false,
        intersect: false,
        rowCol: false
    }
    var count;
    var maxArea = n*n;

    count = passIntersectCheck(poly, true);
    score.val += count * intersectWeight;
    score.intersect = count == 0;
    score.intersectScore = count;

    if (score.intersect) {
        count = passSlopeCheck(poly, true);
    } else {
        count = maxArea;
    }
    score.val += count * slopeWeight;
    score.slope = count == 0;
    score.slopeScore = count;

    // count = passRowColCheck(poly, true);
    // score.val += count * rowColWeight;
    // score.rowCol = count == 0;
    // score.rowColScore = count;
    score.rowCol = true;
    score.rowColScore = 0;

    score.valid = score.slope && score.intersect && score.rowCol;
    score.area = 0;
    if (!score.valid) {
        score.val += maxArea;
        return score;
    }
    score.area = area(poly);
    if (minimise) {
        score.val += score.area;
    } else {
        score.val += maxArea - score.area;
    }
    return score;
}

function mutate(poly, n) {
    let changeX = Math.random() > 0.5;
    var copy = new Array(poly.length); //JSON.parse(JSON.stringify(poly));
    for (var i = 0; i < poly.length; i++) {
        copy[i] = {x: poly[i].x, y: poly[i].y};
    }
    copy.edges = poly.edges;
    // if (changeX) {
    //     var xFrom = Math.floor(Math.random() * n);
    //     var xTo = xFrom;
    //     while (xTo == xFrom) {
    //         xTo = Math.floor(Math.random() * n);
    //     }
    //     copy[xFrom].x = poly[xTo].x;
    //     copy[xTo].x = poly[xFrom].x;
    // } else {
    //     var yFrom = Math.floor(Math.random() * n);
    //     var yTo = yFrom;
    //     while (yTo == yFrom) {
    //         yTo = Math.floor(Math.random() * n);
    //     }
    //     copy[yFrom].y = poly[yTo].y;
    //     copy[yTo].y = poly[yFrom].y;
    // }
    var xFrom = Math.floor(Math.random() * n);
    var xTo = Math.floor(Math.random() * n);
    copy[xFrom].x = poly[xTo].x;
    copy[xTo].x = poly[xFrom].x;
    var yFrom = Math.floor(Math.random() * n);
    var yTo = Math.floor(Math.random() * n);
    copy[yFrom].y = poly[yTo].y;
    copy[yTo].y = poly[yFrom].y;
    return copy;
}

function generatePoly(n) {
    var poly = [];
    var cols = [];
    var rows = [];
    for (var i = 1; i <= n; i++) {
        cols.push(i);
        rows.push(i);
    }
    for (var i = 1; i <= n; i++) {
        var x = cols.splice(Math.floor(Math.random() * cols.length), 1)[0];
        var y = rows.splice(Math.floor(Math.random() * rows.length), 1)[0];
        poly.push({x:x,y:y});
    }
    console.log("Generated", format(poly));

    var edges = [];
    var length = poly.length - 1;
    for(var i = 0; i < length; i++) {
        edges.push([i, i+1]);
    }
    edges.push([length, 0]);
    poly.edges = edges;
    return poly;
}

function mutateShell(poly, n, score) {
    let changeX = Math.random() > 0.5;
    var copy = new Array(poly.length); //JSON.parse(JSON.stringify(poly));
    for (var i = 0; i < poly.length; i++) {
        copy[i] = {x: poly[i].x, y: poly[i].y};
    }
    // if (changeX) {
    //     var xFrom = Math.floor(Math.random() * n);
    //     var xTo = xFrom;
    //     while (xTo == xFrom) {
    //         xTo = Math.floor(Math.random() * n);
    //     }
    //     copy[xFrom].x = poly[xTo].x;
    //     copy[xTo].x = poly[xFrom].x;
    // } else {
    //     var yFrom = Math.floor(Math.random() * n);
    //     var yTo = yFrom;
    //     while (yTo == yFrom) {
    //         yTo = Math.floor(Math.random() * n);
    //     }
    //     copy[yFrom].y = poly[yTo].y;
    //     copy[yTo].y = poly[yFrom].y;
    // }
    var xFrom = Math.floor(Math.random() * n);
    var xTo = Math.floor(Math.random() * n);
    copy[xFrom].x = poly[xTo].x;
    copy[xTo].x = poly[xFrom].x;
    var yFrom = Math.floor(Math.random() * n);
    var yTo = Math.floor(Math.random() * n);
    copy[yFrom].y = poly[yTo].y;
    copy[yTo].y = poly[yFrom].y;
    return copy;
}

function generateShell(n) {
    var poly = [
        {x:n-2, y:2},
        {x:2, y:1},
        {x:1, y:n-2},
        {x:3,y:n},
        {x:n,y:n-1},
        {x:n-1,y:3},
        ];
    var cols = [];
    var rows = [];
    for (var i = 4; i < n-2; i++) {
        cols.push(i);
        rows.push(i);
    }
    for (var i = 4; i < n-2; i++) {
        var x = cols.splice(Math.floor(Math.random() * cols.length), 1)[0];
        var y = rows.splice(Math.floor(Math.random() * rows.length), 1)[0];
        poly.push({x:x,y:y});
    }
    console.log("Generated", format(poly));
    return poly;
}

function transpose(poly, n) {
    var temp = 0;
    for (var i = 0; i < poly.length; i++) {
        var coord = poly[i];
        if (coord.x == coord.y) {
            continue;
        }
        temp = coord.x;
        coord.x = coord.y;
        coord.y = temp;
    }
    return poly;
}

function reverseRow(poly, n) {
    n++;
    for (var i = 0; i < poly.length; i++) {
        var coord = poly[i];
        coord.x = n - coord.x;
    }
    return poly;
}

function reverseCol(poly, n) {
    n++;
    for (var i = 0; i < poly.length; i++) {
        var coord = poly[i];
        coord.y = n - coord.y;
    }
    return poly;
}

function rotateCW(poly, n) {
    return reverseRow(transpose(poly, n), n);
}
function rotateCCW(poly, n) {
    return transpose(reverseRow(poly, n), n);
}
function flipH(poly, n) {
    return reverseRow(poly, n);
}
function flipV(poly, n) {
    return reverseCol(poly, n);
}

function rotateFlat(poly, count) {
  count -= poly.length * Math.floor(count / poly.length)
  poly.push.apply(poly, poly.splice(0, count))
  return poly
}

function normalizeStart(poly, n) {
    // console.log(format(poly));
    var length = poly.length;
    var offset = 0;
    var top = bottom = left = right = n;
    for (var i = 0; i < length; i++) {
        var coord = poly[i];
        if (coord.y == 1) {
            top = coord.x;
        } else if (coord.y == n) {
            bottom = coord.x;
        }
        if (coord.x == 1) {
            left = coord.y;
        } else if (coord.x == n) {
            right = coord.y;
        }
    }
    // console.log(top, bottom, left, right);
    if (n - Math.max(top,bottom) < Math.min(top,bottom)) {
        poly = flipH(poly, n);
        // console.log("flip h because top,bottom is closer to n");
        // console.log(format(poly))
    }
    if (n - Math.max(left,right) < Math.min(left,right)) {
        poly = flipV(poly, n);
        // console.log("flip v because left,right is closer to n");
        // console.log(format(poly))
    }
    for (var i = 0; i < length; i++) {
        var coord = poly[i];
        if (coord.y == 1) {
            top = coord.x;
        } else if (coord.y == n) {
            bottom = coord.x;
        }
        if (coord.x == 1) {
            left = coord.y;
        } else if (coord.x == n) {
            right = coord.y;
        }
    }
    var min = Math.min(top, bottom, left, right);
    // console.log(min, top, bottom, left, right);
    if (top == min) {
        // no need to rotate
        // console.log("top");
    } else if (bottom == min) {
        poly = flipV(poly, n);
        // console.log("bottom flipV");
    } else if (left == min) {
        poly = rotateCW(poly, n);
        // console.log("left rotate 90");
    } else if (right == min) {
        poly = rotateCCW(poly, n);
        // console.log("right rotate -90");
    }
    for (var i = 0; i < length; i++) {
        if (poly[i].y == 1) {
            offset = i;
            break;
        }
    }
    // console.log(format(poly));
    // console.log("offset", offset);
    if (offset > 0) {
        poly = rotateFlat(poly, offset);
    }
    return poly;
}

if (typeof module !== 'undefined' && module.exports) {
module.exports = {
    area,
    passSlopeCheck,
    isIntersect,
    passIntersectCheck,
    passRowColCheck,
    format,
    scorePoly,
    mutate,
    generatePoly,
    rotateCW,
    rotateCCW,
    flipH,
    flipV,
    normalizeStart,
    generateShell,
    mutateShell
};
}
