export {}

function getPromise(name:string, time: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { console.log(name); resolve(name) }, 1000);
    })
}

var p1 = getPromise('one', 1000);
var p2 = getPromise('two', 1000);
var p3 = getPromise('three', 1000);
var p4 = getPromise('four', 1000);
var p5 = getPromise('five', 1000);

console.log("Promise.all:")
Promise.all([p1, p2, p3, p4, p5])
    .then(values => {
        console.log(values);
    })
    .catch(error => {
        console.error(error.message)
    });

console.log("chained with .then():")
getPromise('one', 1000)
    .then(() => getPromise('two', 1000))
    .then(() => getPromise('three', 1000))
    .then(() => getPromise('four', 1000))
    .then(() => getPromise('five', 1000))
    .then(() => sequentialAwaits())

async function sequentialAwaits() {
    console.log("sequential awaits")
    await getPromise('one', 1000);
    await getPromise('two', 1000);
    await getPromise('three', 1000);
    await getPromise('four', 1000);
    await getPromise('five', 1000);
}  
