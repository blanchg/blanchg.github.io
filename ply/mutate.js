const {
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
} = require('./criteria');

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("line", () => {
    console.log("Best", best.score, format(normalizeStart(best.poly, n)));
  });
  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", exit);

function exit() {
    console.log("Best", best.score, format(normalizeStart(best.poly, n)));
    // if (biggestValid)
    //     console.log("BestValid", biggestValid.score, new Date(), "\n", format(biggestValid.poly));
  process.exit();

}
// var test = [{x:3,y:1},{x:1,y:3},{x:2,y:5},{x:4,y:4},{x:5,y:2}];
// console.log("before:", format(test));
// console.log("flipv:", format(flipV(test, 5)));
// console.log("Normalize:", format(normalizeStart(test, 5)));
// process.exit();

var n = process.argv.length > 2 ? parseInt(process.argv[2]) : 5;
var minimise = process.argv.length > 3 ? (process.argv[3] == 'true') : false;

var poly = generatePoly(n);

var state = {
    score: scorePoly(poly, minimise, n),
    poly: poly,
};
var best = {
    score: state.score,
    poly: poly,
}

console.log("Initial state", state);
var kMax = 10000 * n * n;

function P(e1, e2, temp) {
    return Math.exp(-(e2 - e1)/temp);
}

var k = 0;
var bestK = 10000000;
function eval() {
    k++;
    if (k >= kMax) {
        k = 0;
        bestK = 10000000;
        state.poly = generatePoly(n);
        state.score = scorePoly(state.poly, minimise, n);
    }
    let temp = 1 - k/kMax;
    let poly = mutate(state.poly, n);
    let state2 = {
        poly: poly,
        score: scorePoly(poly, minimise, n),
    }
    let p = P(state.score.val, state2.score.val, temp);
    if (p > Math.random()) {
        state = state2;
        if (state.score.val < bestK) {
            bestK = state.score.val;
            k = 0;
        }
        if (state.score.val < best.score.val) {
            best = state;
            console.log('\n', best.score)
            console.log(format(best.poly, n));
        }
    }
    process.stdout.write(k + ": " + state.score.val + "," + state.score.slopeScore + "," + state.score.intersectScore + "," + state.score.rowColScore + ", \t" + (state.score.valid?state.score.area:'--') + "                                            \r");
    setImmediate(eval);
}

eval();
