function draw (data, label_column, value_column, container, coloring, selection_listener) {
	// coloring is optional and contains {color, opacity, stackon} options
	// stackon can be: base, previous, or a number indicating index of basis of stacking
	// for now just base and previous is defined
	// selection_listener is also optional and sets a listener to click event on bars
	$(container).html("");
	temp = data;
	
	if (coloring == undefined || ! coloring.length)
		coloring = [{"color":"steelblue", "opacity":1, "stackon":"base"}];
	var number_of_overlay = coloring.length;
	
	var margin = {top: 30, right: 20, bottom: 10, left: 80},
		width = $(container).width() - margin.right - margin.left,
		height = $(container).height() - margin.top - margin.bottom;

	var format = function (value) {
		if (value < 1000) return value;
		if (value > 1000 && value < 1000000) return Math.round(value /1000) + "K";
		if (value > 1000000) return Math.round(value/1000000) + "M";
		return value;
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
		.tickSize(0);

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
			.attr("opacity", function (d) { return v.opacity; })
			.attr("stroke", function (d) { return v.border.split(" ")[0] || "none"; })
			.attr("stroke-dasharray", function (d) { 
				if ((v.border.split(" ")[1] || "none") == "dashed")
					return "5,5";
				else
					return "none";
			})
			.on("click", function (d) { 
				selection_listener.selectionChanged(label_column, $(this).attr("data-label"));
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

function chart (type, x, x_aggregate, y, y_aggregate, store, selection_object) {
	this.type = type;
	this.x = x;
	this.x_aggregate = x_aggregate;
	this.y = y;
	this.y_aggregate = y_aggregate;
	this.store = store;
	this.container = null;
	this.selection = selection_object || new selection ();
	
	this.isStacked = false;
	
	var object = this;
	
	this.validate = function () {
		if (this.store.getColumn(this.y).type != "interval")
			return false;
		if (this.store.getColumn(this.x).type == "category" && this.y_aggregate == null)
			return false;
		return true;
	};
	
	this.draw = function (container) {
		var highlighting_opacity = 1;
		this.container = container;
		// $(this.container).html("validate result: " + this.validate() + "<br>");
		// $(this.container).append("drawing " + this.type + " chart of " + this.x + " of type " + this.store.getColumn(x).type);
		// draw using drawing object
		if (this.isStacked) {
			var result = this.store.getAggregatedColumns(this.compact(), [this.x], 
									[new all_selector(), 
									new combined_selection(my_selection, other_selection, "not"), 
									new combined_selection(my_selection, other_selection, "and"), 
									new combined_selection(other_selection, my_selection, "not")]);
			var coloring = [{"color":"white", "border":"black solid", "opacity":1,"stackon":"base", "text":"none"}, 
				{"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"none"}, 
				{"color":"red", "border":"black dashed", "opacity":2*highlighting_opacity,"stackon":"previous", "text":"none"},
				{"color":"none", "border":"black dashed", "opacity":highlighting_opacity,"stackon":"previous", "text":"none"}];
		} else {
			var result = this.store.getAggregatedColumns(this.compact(), [this.x], 
									[new all_selector(), 
									my_selection, 
									other_selection]);
			var coloring = [{"color":"white", "border":"black solid", "opacity":1,"stackon":"base", "text":"none"}, 
				{"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"end"}, 
				{"color":"none", "border":"black dashed", "opacity":highlighting_opacity,"stackon":"base", "text":"none"}];
		}
		if (this.type == "bar")
			draw(result, this.x, this.y, this.container, coloring, this);
	};
	
	this.redraw = function () {
		this.draw(this.container);
	};true
	
	this.compact = function () {
		return [{"name":this.x, "aggregate":this.x_aggregate}, {"name":this.y, "aggregate":this.y_aggregate}];
	};
}

chart.prototype.selectionChanged = function (column, value) {
	if (this.store.getColumn(column).valuetype == "integer")
		value = parseInt(value);
	if (base_selection.hasValue(column, value)) {
		base_selection.remove(column, [value]);
	} else {
		base_selection.clear();
		base_selection.append(column, [value], false);
	}
	$("#selection").html("Yours {" + my_selection.toString() + "}, Others {" + other_selection.toString() + "}");
	hub.broadcast();
};