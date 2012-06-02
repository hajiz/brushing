function dataStore (source, callback) {
	this.source = source;
	this.columns = [];
	this.column_names = [];
	this.store = [];
	this.size = 0;
	this.ready = false;
	var obj = this;
	
	this.refineStore = function (rows) {
		this.store = rows;
		$.each(this.columns, function (i, v) {
			if (v.valuetype == "integer" || v.valuetype == "float") {
				var min, max;
				var different_Values = [];
				var first = true;
				$.each(obj.store, function (j, d) {
					if (v.valuetype == "integer")
						d[v.name] = parseInt(d[v.name]);
					else (v.valuetype == "float")
						d[v.name] = parseFloat(d[v.name]);
					if (first) {
						first = false;
						min = max = d[v.name]
					}
					if (d[v.name] > max) max = d[v.name];
					if (d[v.name] < min) min = d[v.name];
					if (different_Values.indexOf(d[v.name]) == -1) different_Values.push(d[v.name]);
				});
				v["min"] = min;
				v["max"] = max;
				v["categories"] = different_Values.length;
			}
		});
	};
	
	d3.json(source, function (json) {
		if (json == null) { callback(false); return; }

		$.each(json.columns, function (i, v) { obj.column_names.push(v.name); });
		obj.columns = json.columns;
		obj.size = json.rows.length;
		//obj.store = json.rows;
		obj.refineStore(json.rows);
		//temp = obj.store;

		obj.ready = true;
		callback(true);
	});
};

dataStore.prototype.getColumns = function () {
	return this.column_names;
};

dataStore.prototype.getStore = function (show_columns) {
	show_columns = show_columns || this.getColumns();
	if (show_columns.length == 0)
		show_columns = this.getColumns();
	var result = [];
	$.each(this.store, function (i, v) {
		var item = {};
		for (var i = 0; i < show_columns.length; i ++)
			item[show_columns[i]] = v[show_columns[i]];
		result.push(item);
	});
	return result;
};

dataStore.prototype.getColumn = function (column_name) {
	var out = null;
	$.each(this.columns, function (i, v) {
		if (v.name == column_name)
			out = v;
	});
	return out;
};

dataStore.prototype.getAggregatedColumns = function (columns, over, selections) {
	var all_selector = function () { this.columns = function () { return []; }; this.contains = function (record) { return true; }; };
	selections = selections || [new all_selector ()];
	if (selections.length == 0)
		selections = [all_selector];
	// columns is of type {name, aggregate}, aggregate can be null (which means no aggregation is needed
	if (over.length == 1) {
		var out = {};
		over = over[0];
		var column_names = [];
		var aggregation = {};
		var count = {};
		$.each(columns, function (i, v) {
			column_names.push(v.name);
			aggregation[v.name] = v.aggregate;
		});
		var allcolumns = [];
		allcolumns.concat(column_names);
		$.each (selections, function (s_i, s_v) {
			allcolumns.concat(s_v.columns());
		});
		var chunk = false, base = 0, step = 0, roundboundries = false;
		if (this.isNumeric(over) && this.getColumn(over).categories > 8) {
			chunk = true;
			base = this.getColumn(over).min;
			step = (this.getColumn(over).max - this.getColumn(over).min) / 4;
			if (this.getColumn(over).valuetype == "integer")
				roundboundries = true;
		}
		// allcolumns contains every column required
		// column_names is only columns that need to be returned
		$.each (this.getStore(allcolumns), function(i, v) {
			var index = v[over];
			if (chunk) {
				var range = parseInt((index - base) / step);
				index = range;
			}
			var object = out[index] || {};
			$.each(selections, function (s_i, s_v) {
				if (s_v.contains(v)) {
					$.each(column_names, function (c_i, c_v) {
						if (object[c_v] == undefined) object[c_v] = [];
						if (object[c_v][s_i] == undefined) {
							object[c_v][s_i] = v[c_v];
						} else {
							switch (aggregation[c_v]) {
								case 'sum':
									object[c_v][s_i] = object[c_v][s_i] + v[c_v];
									break;
								case 'average':
									object[c_v][s_i] = object[c_v][s_i] + v[c_v];
									break;
								case 'min':
									if (object[c_v][s_i] > v[c_v])
										object[c_v][s_i] = v[c_v];
									break;
								case 'max':
									if (object[c_v][s_i] < v[c_v])
										object[c_v][s_i] = v[c_v];
									break;
								default:
									object[c_v][s_i] = v[c_v];
							}
						}
					});
					if (count[index] == undefined) count[index] = [];
					if (count[index][s_i] == undefined) 
						count[index][s_i] = 1;
					else
						count[index][s_i] ++;
				}
			});
			out[index] = object;
		});
		temp = count;
		var refined = [];
		$.each(out, function (i, v) {
			if ($.isEmptyObject(v)) return;
			if (chunk) {
				$.each(selections, function (s_i, s_v) {
					var start = (base+step*i);
					var end = (base+step*i+step);
					v[over][s_i] = start + "~" + end;
				});
			}
			$.each(column_names, function (ii, vv) {
				if(aggregation[vv] == "average") {
					$.each(selections, function (s_i, s_v) {
						if (v[vv][s_i] != undefined && count[v[over][s_i]] != undefined && count[v[over][s_i]][s_i] != undefined) {
							v[vv][s_i] = v[vv][s_i] / count[v[over][s_i]][s_i];
						}
					});
				}
			});
			refined.push(v);
		});
		return refined;
	}
	return this.getStore(columns);
};

dataStore.prototype.isNumeric = function (column) {
	if (this.getColumn(column).valuetype == "integer" || this.getColumn(column).valuetype == "float")
		return true;
	return false;
};