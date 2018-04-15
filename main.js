let colors = require('colors');
let asciichart = require('asciichart');
let sleep = require('sleep');

const rabbitSize = 1; // Physical space taken up by rabbits
const bobcatSize = 3; // Physical space taken up by bobcats, this means bobcats are 4x4
const mapSize = 24; // Map size in units
const gens = 100; // Amount of generations to run through
const granularity = 10; // Number of steps to graph
const showAnimation = true; // Show generations as they happen, set to false to only see last generation
const animationSpeed = 100; // Millisecond delay between rewrites for animation if applicable

const maxRabbits = 0 || (mapSize**2)/2; // Carrying capacity of rabbits

let initRabbitCount = 3; // Amount of starting rabbits, also used as a counter later on
let bobcats = 1; // Amount of starting bobcats, also used as a counter later on
let map = []; // Holds all values for the map

// Initialize the map with the predefined sizes
for (let i = 0; i < mapSize; i++){
    map.push(new Array(mapSize).fill(0));
}

// Create random placement of rabbits throughout map
for (let r = 0; r < initRabbitCount; r++) {
    let x = Math.ceil(Math.random() * mapSize - rabbitSize);
    let y = Math.ceil(Math.random() * mapSize - rabbitSize);
    if (!map[x][y]) {
        map[x][y] = 1;
    } else {
        initRabbitCount++;
    }
}

// Function to clear the console
console.reset = function () {
    return process.stdout.write('\033c');
};

// Function to return amount of rabbits alive at a given time on a map
function getAlive(curMap){
    let aliveCount = curMap.map((row, indexX) => {
        return row.filter((col) => col === 1) || null;
    }).filter((val) => val.length !== 0);
    let finalCount = 0;
    for (let r = 0; r < aliveCount.length; r++){
        for (let c = 0; c < aliveCount[r].length; c++){
            finalCount++;
        }
    }
    return finalCount;
}

// Takes map and doubles the population of rabbits, distributed randomly
function spawnNewRabbits(curMap){
    let startingPop = getAlive(curMap) || 3;
    for (let r = 0; r < startingPop && startingPop <= maxRabbits/2; r++) {
        let x = Math.ceil(Math.random() * mapSize - rabbitSize);
        let y = Math.ceil(Math.random() * mapSize - rabbitSize);
        if (!curMap[x][y]) {
            curMap[x][y] = 1;
        } else {
            startingPop++;
        }
    }
    return curMap;
}

// Function to run a single generation given a map and the amount of bobcats in that generation
function doGeneration(curMap, bobcatNum){
    let totalEaten = 0;
    for (let i = 0; i < bobcatNum; i++){
        let x = Math.floor(Math.random() * mapSize - bobcatSize);
        let y = Math.floor(Math.random() * mapSize - bobcatSize);
        let eatenRabbis = curMap.map((row, indexX) => {
            let eaten = row.map((val, indexY) => {
                let countsRow = 0;
                if (indexX >= x && indexX <= x + bobcatSize && indexY >= y && indexY <= y + bobcatSize) {
                    if (val) {
                        totalEaten++;
                        curMap[indexX][indexY] = 0;
                    }
                }
                return countsRow;
            });
            return eaten;
        });
    }
    return [spawnNewRabbits(curMap), totalEaten];
}

// Code to manage generations, brain of the code
let eatenOverTime = [];
let bobcatsOverTime = [];
for (let gen = 0; gen < gens; gen++) {
    let res = doGeneration(map, bobcats);
    let newBobcats = Math.floor(res[1] / 3);
    if (newBobcats < bobcats || bobcats === 0){
        bobcats = 1;
    } else {
        bobcats += newBobcats - bobcats;
    }
    map = res[0];
    eatenOverTime.push(res[1]);
    bobcatsOverTime.push(bobcats);
    console.clear();
    for (let x = 0; x < map.length; x++){
        let printStr = "";
        for (let y = 0; y < map[x].length; y++){
            if (map[x][y]){
                printStr += 'r'.toString().green+" ";
            } else {
                printStr += 'e'.toString().red+" ";
            }
        }
        console.log(printStr);
    }
    if (showAnimation) sleep.msleep(animationSpeed);
}

// Calculates max values of arrays for pretty plotting
const maxEaten = Math.max.apply(null, eatenOverTime);
const maxBobcats = Math.max.apply(null, bobcatsOverTime);

// Processes values into a graphable format
const rfinal = eatenOverTime.map((val) => (val / maxEaten)*granularity);
const bfinal = (maxBobcats === 1) ? bobcatsOverTime : bobcatsOverTime.map((val) => ((val-1) / (maxBobcats-1))*granularity);

// Prints the ending game map, 'r' means rabbit, 'e' means empty
// console.log(("Final Map after " + gens + " iterations").blue);
// for (let x = 0; x < map.length; x++){
//     let printStr = "";
//     for (let y = 0; y < map[x].length; y++){
//         if (map[x][y]){
//             printStr += 'r'.toString().green+" ";
//         } else {
//             printStr += 'e'.toString().red+" ";
//         }
//     }
//     console.log(printStr);
// }

// Prints ascii graphs of Rabbits eaten and bobcats alive over the generations
console.log(("Percent Rabbits eaten over "+gens+" generations").blue);
console.log(asciichart.plot(rfinal));
console.log(("Percent Bobcats alive over time "+gens+" generations").blue);
// ASCII Chart breaks with an array with only 1s, so we spoof a chart showing only 1s if that is the case
if (maxBobcats === 1){
    let bstring = "       1.00 ┼─";
    for (let i = 0; i < gens-2; i++){
        bstring += '─';
    }
    console.log(bstring);
} else {
    console.log(asciichart.plot(bfinal));
}
