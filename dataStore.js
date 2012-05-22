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
			if (v.valuetype == "integer") {
				$.each(obj.store, function (j, d) {
					d[v.name] = parseInt(d[v.name]);
				});
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
		// allcolumns contains every column required
		// column_names is only columns that need to be returned
		$.each (this.getStore(allcolumns), function(i, v) {
			var index = v[over];
			var object = out[index] || {};
			$.each(selections, function (s_i, s_v) {
				if (s_v.contains(v)) {
					$.each(column_names, function (c_i, c_v) {
						if (object[c_v] == undefined) object[c_v] = [];
						if (count[index] == undefined) count[index] = [];
						if (object[c_v][s_i] == undefined) {
							object[c_v][s_i] = v[c_v];
							count[index][s_i] = 1;
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
							count[index][s_i] ++;
						}
					});
				}
			});
			out[index] = object;
		});
		temp = count;
		var refined = [];
		$.each(out, function (i, v) {
			if ($.isEmptyObject(v)) return;
			$.each(column_names, function (ii, vv) {
				if(aggregation[vv] == "average") {
					$.each(selections, function (s_i, s_v) {
						if (v[vv][s_i] != undefined && count[v[over]] != undefined && count[v[over]][s_i] != undefined)
							v[vv][s_i] = v[vv][s_i] / count[v[over]][s_i];
					});
				}
			});
			refined.push(v);
		});
		return refined;
	}
	return this.getStore(columns);
};
