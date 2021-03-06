function chartDrawer (type, x, x_aggregate, y, y_aggregate, store, hub_object, my_selection, other_selection, draw_mine, draw_others, draw_stacked, interactive, container) {
	var selection = null;
	if (interactive)
		selection = my_selection;
	var selections = [new all_selector()];
	var colorings = [{"color":"white", "border":"black", "opacity":1,"stackon":"base", "text":"none"}];
	// stacked
	// [new all_selector(), 
	// new combined_selection(my_selection, other_selection, "not"), 
	// new combined_selection(my_selection, other_selection, "and"), 
	// new combined_selection(other_selection, my_selection, "not")]);
	// var coloring = [{"color":"white", "border":"black solid", "opacity":1,"stackon":"base", "text":"none"}, 
	// {"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"none"}, 
	// {"color":"red", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"previous", "text":"none"},
	// {"color":"none", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"previous", "text":"none"}];
	// 
	// not stacked
	// [new all_selector(),  
	// my_selection,
	// other_selection]);
	// var coloring = [{"color":"white", "border":"black solid", "opacity":1,"stackon":"base", "text":"none"}, 
	// {"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"end"},
	// {"color":"blue", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"base", "text":"none"}];
	var highlighting_opacity = 0.2;
	if (!draw_stacked || !draw_others) {
		if (draw_mine) {
			selections.push(my_selection);
			colorings.push({"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"end"});
		}
		if (draw_others) {
			selections.push(other_selection);
			colorings.push({"color":"blue", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"base", "text":"none"});
		}
	} else {
		if (draw_mine) {
			selections.push(new combined_selection(my_selection, other_selection, "not"));
			selections.push(new combined_selection(my_selection, other_selection, "and"));
			selections.push(new combined_selection(other_selection, my_selection, "not"));
			colorings.push({"color":"red", "border":"none", "opacity":1,"stackon":"base", "text":"none"});
			colorings.push({"color":"red", "border":"blue dashed", "opacity":1,"stackon":"previous", "text":"none"});
			colorings.push({"color":"blue", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"previous", "text":"none"});
		} else {
			selections.push(other_selection);
			colorings.push({"color":"blue", "border":"blue dashed", "opacity":highlighting_opacity,"stackon":"base", "text":"none"});
		}
	}
	// type, x, x_aggregate, y, y_aggregate, store, selection_object, hub_object, selections, colorings
	var _chart = new chart (type, x, x_aggregate, y, y_aggregate, store, selection, hub_object, selections, colorings);
	hub_object.addChart(_chart);
	_chart.draw($(container));
	return _chart;
}