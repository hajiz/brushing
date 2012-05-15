function broadcast () {
	this.charts = [];
	this.addChart = function (chart) {
		if (! (chart in this.charts))
			this.charts.push(chart);
	};
	this.broadcast = function () {
		$.each (this.charts, function (i, v) {
			v.redraw();
		});
	};
	this.changeAttr = function (attr, newvalue) {
		$.each (this.charts, function (i, v) {
			v[attr] = newvalue;
		});
	};
}