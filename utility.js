function keys (object) {
	if (Object.keys)
		return Object.keys(object);
	var keys = [];
	for (key in object)
		keys.push(key);
}