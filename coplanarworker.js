
// var console = {
//   log: log
// };

// in worker.js
self.addEventListener('message', function() {
  // We received a message from the main thread!
  // do some computation that may normally cause the browser to hang
  // in my case, I computed the position of an object in space according
  // to Kepler's Laws

  console.log("Sent a message from the worker", this);

  //  now send back the results
  // self.postMessage({
  //   type: 'results',
  //   data: {
  //     // ...
  //   }
  // })
});

console.log("Worker is waiting for messages")

function log() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i])
  }
  var out = args
    .map(function(arg) {
      return arg.toString();
    })
    .join(" ");
  self.postMessage({
    type: 'debug',
    value: out
  });
}