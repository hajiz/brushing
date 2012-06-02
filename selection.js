// call selection(attr, [v1,v2,v3,...], false) or selection(attr, [start, end], true)
function selection (attr, values, isrange) {
	isrange = isrange || false;
	this.selection = {};
	this.append = function (attr, values, isrange) {
		isrange = isrange || false;
		if (! (attr in this.selection))
			this.selection[attr] = {"isrange":isrange, "values":[]};
		if (!isrange) {
			this.selection[attr].values = this.selection[attr].values.concat(values);
			this.selection[attr].isrange = false;
		} else {
			this.selection[attr].values.push({"start":values[0], "end":values[1]});
			this.selection[attr].isrange = true;
		}
	};
	this.remove = function (attr, values) {
		var object = this;
		if (attr in this.selection) {
			if (! this.selection[attr].isrange) {
				$.each(values, function (i, v) {
					var index = object.selection[attr].values.indexOf(v);
					object.selection[attr].values.splice(index, 1);
					if (object.selection[attr].values.length == 0)
						delete object.selection[attr];
				});
			} else {
				$.each(this.selection[attr].values, function (i, v) {
					if (v.start == values[0] && v.end == values[1])
						object.selection[attr].values.splice(i, 1);
				});
				if (object.selection[attr].values.length == 0)
						delete object.selection[attr];
			}
		}
	};
	this.hasValue = function (attr, value) {
		if (! (attr in this.selection))
			return false;
		return ($.inArray(value, this.selection[attr].values) != -1);
	};
	this.hasRange = function (attr, start, end) {
		if (! (attr in this.selection))
			return false;
		var out = false;
		$.each(this.selection[attr].values, function (i, v) {
			if (v.start == start && v.end == end)
				out = true;
		});
		return out;
	};
	if (attr)
		this.append(attr, values, isrange);
}

selection.prototype.toString = function () {
	var out = "";
	$.each(this.selection, function (i, v) {
		if (v.isrange)
			$.each(v.values, function(ii, vv) {
				out += i + " in (" + vv.start + "," + vv.end + ")\n";
			});
		else
			out += i + "=" + v.values + "\n";
	});
	return out;
};

selection.prototype.contains = function (record) {
	if ($.isEmptyObject(this.selection)) return false;
	var out = true;
	$.each(this.selection, function (i, v) {
		if (v.isrange) {
			var temp = false;
			$.each(v.values, function (ii, vv) {
				if (record[i] >= vv.start && record[i] < vv.end)
					temp = true;
			});
			if (!temp) out = false;
		} else {
			if ($.inArray(record[i], v.values) == -1)
				out = false;
		}
	});
	return out;
};

selection.prototype.clear = function () {
	this.selection = {};
};

selection.prototype.columns = function () {
	return Object.keys(this.selection);
};

// combined selections
function combined_selection (s1, s2, how) {
	this.s1 = s1;
	this.s2 = s2;
	this.how = how;
	
	this.contains = function (record) {
		switch(this.how) {
			case 'and':
				return (this.s1.contains(record) && this.s2.contains(record));
			case 'or':
				return (this.s1.contains(record) || this.s2.contains(record));
			case 'not':
				return (this.s1.contains(record) && !this.s2.contains(record));
			case 'xor':
				return (this.s1.contains(record) && !this.s2.contains(record)) || (!this.s1.contains(record) && this.s2.contains(record));
		}
	};
	
	this.columns = function () {
		c1 = this.s1.columns();
		c2 = this.s2.columns();
		c = c1.concat(c2).sort();
		single = [];
		for (var i = 0; i < c.length - 1; i ++)
			if (c[i] != c[i+1])
				single.push(c[i]);
		if (c.length > 0)
			single.push(c[c.length - 1]);
		return single;
	};
	
	this.toString = function () {
		return this.s1.toString() + "" + how + "\n" + this.s2.toString();
	};
}

function all_selector () { 
	this.columns = function () { return []; };
	this.contains = function (record) { return true; };
	this.toString = function () { return "*"; };
};