var logs = [];

function log (action) {
	// current time
	logs.push({"action": action, "time": new Date()});
}