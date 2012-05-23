<?php
	// requires:
	// 	name
	// 	max (default 2)
	// 	threshold (default 10s)
	// 	dataset

	include_once('db.inc.php');

	$name = $_GET['name'];
	$dataset = $_GET['dataset'];
	if (isset($_GET['max']))
		$max = $_GET['max'];
	else
		$max = 2;
	if (isset($_GET['threshold']))
		$threshold = $_GET['threshold'];
	else
		$threshold = 4;

	if (exists("SELECT * FROM session WHERE name='$name'"))
		executeQuery("UPDATE session SET threshold=$threshold, max_participant=$max, dataset='$dataset' WHERE name='$name'");
	else
		executeQuery("INSERT INTO session (`name`, `max_participant`, `threshold`, `dataset`) VALUES ('$name', $max, $threshold, '$dataset')");
	
	$result = runQuery("SELECT id FROM session WHERE name='$name'");
	foreach ($result as $s) $id = $s['id'];
	
	executeQuery("DELETE FROM user WHERE session_id=$id");
	for ($i = 1; $i <= $max; $i++)
		executeQuery("INSERT INTO user (id, session_id) VALUES ($i, $id)");
?>