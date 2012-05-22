<?php
function makeConnection() {
	$link = mysql_connect('localhost', 'root', '');
	if (!$link) {
	    die('FATAL ERROR: Could not connect: ' . mysql_error());
	}
	$db_selected = mysql_select_db('collaboration', $link);
	if (!$db_selected) {
	    die ('FATAL ERROR: Can\'t use collaboration database : ' . mysql_error());
	}
	return $link;
}

function closeConnection($link) {
	mysql_close($link);
}

function runQuery($query) {
	$result = mysql_query($query);
	if (!$result) {
	    die('FATAL ERROR: Invalid run query ('.$query.'): ' . mysql_error());
	}
	$result_array = array();
	while ($row = mysql_fetch_assoc($result)) {
		array_push($result_array, $row);
	}
	return $result_array;
}

function executeQuery($query) {
	$result = mysql_query($query);
	if (!$result) {
	    die('FATAL ERROR: Invalid execute query ('.$query.'): ' . mysql_error());
	}
}

function exists($query) {
	$result = mysql_query($query);
	if (!$result) {
	    die('FATAL ERROR: Invalid exists query ('.$query.'): ' . mysql_error());
	}
	$result_array = array();
	if (($row = mysql_fetch_assoc($result)))
		return TRUE;
	else
		return FALSE;
}

function newline() {
	echo '<br/>';
}

makeConnection();
?>