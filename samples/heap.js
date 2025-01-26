// Force node to run out of heap space

const allocations = [];

function allocateMemory() {
	try {
		while (true) {
			allocations.push(new Array(1e6).fill("*"));
		}
	} catch (e) {
		console.error("Heap allocation error:", e);
	}
}

allocateMemory();
