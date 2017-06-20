var log = require('../../../log').logger('sbp');
var g2 = require('../../../g2');
var sb3_commands = require('../sb3_commands');
var config = require('../../../config');

// Generic probe function
// opts:
//  inp : input number (int)
//  dist : map of axis word (X,Y,Z,A,B,C) to search distance
//  feed : feedrate in units/sec
//
function probe(runtime, opts) {

	var name = 'di' + opts.inp + 'fn';

	var cmd1 = {};
	cmd1[name] = 4

	var cmd2 = ['G38.2']
	for(word in opts.dist) {
		cmd2.push(word + opts.dist[word].toFixed(5))
	}
	cmd2.push('F' + (opts.feed*60.0).toFixed(3))
	runtime.emit_gcode('M100.1(' + JSON.stringify(cmd1) + ')');
	runtime.emit_gcode(cmd2.join(' '));
}

exports.PX = function(args) {
	this.cmd_posx = undefined
    probe(this, {
		inp : args[2],
		feed : args[1],
		dist : {
			X : args[0]
		}
	});
};

exports.PY = function(args) {
	this.cmd_posy = undefined
	probe(this, {
		inp : args[2],
		feed : args[1],
		dist : {
			Y : args[0]
		}
	})
};

exports.PZ = function(args) {
	this.cmd_posz = undefined
	probe(this, {
		inp : args[2],
		feed : args[1],
		dist : {
			Z : args[0]
		}
	})
};

exports.P2 = function(args) {
	this.cmd_posx = undefined
	this.cmd_posy = undefined
	probe(this, {
		inp : args[3],
		feed : args[2],
		dist : {
			X : args[0],
			Y : args[1]
		}
	})
};
