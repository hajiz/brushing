function draw (data, label_column, value_column, container, coloring, selection_listener, int_axis) {
	// coloring is optional and contains {color, opacity, stackon} options
	// stackon can be: base, previous, or a number indicating index of basis of stacking
	// for now just base and previous is defined
	// selection_listener is also optional and sets a listener to click event on bars
	if (value_column == "Histogram")
		$(container).html("<span class='chart_header' style='font-size: 10px;'>" + "" + label_column + "</span>");
	else
		$(container).html("<span class='chart_header' style='font-size: 10px;'>" + value_column + " based on <span class='key_dimension'>" + label_column + "</span></span>");
	
	int_axis = int_axis || false;
	
	if (coloring == undefined || ! coloring.length)
		coloring = [{"color":"steelblue", "opacity":1, "stackon":"base"}];
	var number_of_overlay = coloring.length;
	
	var margin = {top: 30, right: 20, bottom: 10, left: 80},
		width = $(container).width() - margin.right - margin.left,
		height = $(container).height() - margin.top - margin.bottom;

	var format = function (value) {
		if (value < 1000) return d3.format(".1f")(value);
		if (value > 1000 && value < 1000000) return d3.format(".1f")(value / 1000) + "K";
		if (value > 1000000) return d3.format(".1f")(value/1000000) + "M";
		return value;
	};
	
	var rangeformat = function (value) {
		if (! value.indexOf || value.indexOf("~") == -1) {
			if (value.length > 10)
				return value.substring(0, 9) + "..";
			return value;
		}
		var start = value.split("~")[0];
		var end = value.split("~")[1];
		if (int_axis) {
			start = parseInt(start);
			end = parseInt(end);
		} else {
			start = parseFloat(start);
			start = d3.format(".2f")(start);
			end = parseFloat(end);
			end = d3.format(".2f")(end);
		}
		return start + "~" + end;
	};

	var x = d3.scale.linear()
		.range([0, width]);

	var y = d3.scale.ordinal()
		.rangeRoundBands([0, height], .1);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("top")
		.tickSize(-height);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickSize(0)
		.tickFormat(rangeformat);

	var svg = d3.select($(container).get(0)).append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Before entering data manipulation, define some useful functions
	function getLabel (d) {
		for (var i = 0; i < d[label_column].length; i++)
			if (d[label_column][i] != undefined)
				return d[label_column][i];
		return null;
	}
	function getValue (d, index) {
		if (d != undefined && d[value_column] != undefined && d[value_column][index] != undefined)
			return d[value_column][index];
		return 0;
	}
	function getMaxValue (d) {
		var value = [];
		$.each (coloring, function (i, v) {
			value[i] = d[value_column][i];
			if (v.stackon == "previous")
				value[i] += value[i-1];
		});
		return d3.max(value, function (d) { return d; });
	}
	var max_value = d3.max(data, function(d) { return getMaxValue(d); });
	// Set the scale domain.
	x.domain([0, max_value]);
	y.domain(data.map(function(d) { return getLabel(d); }));

	$.each (coloring, function (i, v) {
		var bar = svg.selectAll("g.bar"+i)
			.data(data)
			.enter().append("g")
				.attr("class", "bar"+i)
				.attr("transform", function(d) { 
					var base = 0;
					var temp = i;
					while (coloring[temp].stackon == "previous" && temp > 0) {
						base += x(getValue(d, temp-1));
						temp --;
					}
					return "translate(" + base + "," + y(getLabel(d)) + ")";
				});

		//bar.append("rect")
		//	.attr("width", function(d) { return x(getValue(d, i)); })
		//	.attr("height", y.rangeBand())
		//	.attr("fill", function (d) { return "white"; });
			
		bar.append("rect")
			.attr("width", function(d) { return x(getValue(d, i)); })
			.attr("height", y.rangeBand())
			.attr("data-label", function (d) {return getLabel(d); })
			.attr("data-value", function (d) {return getValue(d, i); })
			.attr("fill", function (d) { return v.color; })
			.attr("fill-opacity", function (d) { return v.opacity; })
			.attr("stroke", function (d) { return v.border.split(" ")[0] || "none"; })
			.attr("stroke-dasharray", function (d) { 
				if ((v.border.split(" ")[1] || "none") == "dashed")
					return "5,5";
				else
					return "none";
			})
			.on("click", function (d) {
				if ($(this).attr("data-label").indexOf("~") != -1) {
					selection_listener.selectionChanged(label_column, true, $(this).attr("data-label").split("~")[0], $(this).attr("data-label").split("~")[1]);
				} else
					selection_listener.selectionChanged(label_column, false, $(this).attr("data-label"));
			});
			
		if (v.text == "end")
			bar.append("text")
				.attr("class", "value")
				.attr("x", function(d) { return x(getValue(d, i)); })
				.attr("y", y.rangeBand() / 2)
				.attr("dx", -3)
				.attr("dy", ".35em")
				.attr("text-anchor", "end")
				.text(function(d) { if (getValue(d,i) < 0.1 * max_value) return ""; return format(getValue(d, i)); });
	});

	svg.append("g")
		.attr("class", "x axis")
		;//.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
}

function chart (type, x, x_aggregate, y, y_aggregate, store, selection_object, hub_object, selections, colorings) {
	this.type = type;
	this.x = x;
	this.x_aggregate = x_aggregate;
	this.y = y;
	this.y_aggregate = y_aggregate;
	this.store = store;
	this.container = null;
	this.selection = selection_object || new selection ();
	this.hub = hub_object || new broadcast();
	
	this.drawSelfSelectionOnly = true;
	
	this.selections = selections || [];
	this.colorings = colorings || [];
	
	var object = this;
	
	this.validate = function () {
		if (this.store.getColumn(this.y).type != "interval")
			return false;
		if (this.store.getColumn(this.x).type == "category" && this.y_aggregate == null)
			return false;
		return true;
	};
	
	this.setDrawingSelections = function (selections) {
		// selections as [{"selection":selection, "drawing":drawing}, ...]
		var object = this;
		this.selections = [];
		this.colorings = [];
		$.each(selections, function (i, s) {
			object.selections.push(s.selection);
		});
	};
	
	this.draw = function (container) {
		this.container = container;
		// $(this.container).html("validate result: " + this.validate() + "<br>");
		// $(this.container).append("drawing " + this.type + " chart of " + this.x + " of type " + this.store.getColumn(x).type);
		// draw using drawing object
		var temp_selections = this.selections.slice(0);
		var temp_colorings = this.colorings.slice(0);
		if (temp_selections.length == 3 && this.drawSelfSelectionOnly)
			if (keys(this.selections[2].selection).indexOf(this.x) == -1) {
				temp_selections.splice(2,1);
				temp_colorings.splice(2,1);
			}
		var result = this.store.getAggregatedColumns(this.compact(), [this.x], temp_selections);
		if (this.type == "bar")
			draw(result, this.x, this.y, this.container, temp_colorings, this, (this.store.getColumn(this.x).valuetype == "integer"));
	};
	
	this.redraw = function () {
		this.draw(this.container);
	};
	
	this.compact = function () {
		return [{"name":this.x, "aggregate":this.x_aggregate}, {"name":this.y, "aggregate":this.y_aggregate}];
	};
}

chart.prototype.selectionChanged = function (column, range, value, endvalue) {
	if (!range) {
		if (this.store.getColumn(column).valuetype == "integer")
			value = parseInt(value);
		if (this.store.getColumn(column).valuetype == "float")
			value = parseFloat(value);
		if (this.selection.hasValue(column, value)) {
			this.selection.remove(column, [value]);
		} else {
			this.selection.clear();
			this.selection.append(column, [value], false);
		}
		if (window.base_selection)
			log("selection changed to " + JSON.stringify(base_selection.selection));
		this.hub.broadcast();
	} else {
		if (this.store.isNumeric(column))
			value = parseFloat(value);
		if (this.store.isNumeric(column))
			endvalue = parseFloat(endvalue);
		if (this.selection.hasRange(column, value, endvalue)) {
			this.selection.remove(column, [value, endvalue]);
		} else {
			this.selection.clear();
			this.selection.append(column, [value, endvalue], true);
		}
		if (window.base_selection)
			log("selection changed to " + JSON.stringify(base_selection.selection));
		this.hub.broadcast();
	}
};