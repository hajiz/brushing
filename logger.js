var logs = [];

function log (action) {
	// current time
	logs.push({"action": action.replace(/"/g, "\\\""), "time": new Date().toString()});
}