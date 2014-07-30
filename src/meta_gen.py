#!/usr/bin/env python
import os, sys, js2crx;



# Usage info
def usage(arguments_descriptor, stream):
	usage_info = [
		"Usage:",
		"    {0:s} [flags] <input> <output>".format(os.path.split(sys.argv[0])[1]),
		"\n",
		"Available flags:",
	];

	# Flags
	argument_keys = sorted(arguments_descriptor.keys());

	for i in range(len(argument_keys)):
		key = argument_keys[i];
		arg = arguments_descriptor[key];
		param_name = "";
		if (not ("bool" in arg and arg["bool"])):
			if ("argument" in arg):
				param_name = " <{0:s}>".format(arg["argument"]);
			else:
				param_name = " <value>";

		if (i > 0):
			usage_info.append("");

		if ("long" in arg):
			for a in arg["long"]:
				usage_info.append("  --{0:s}{1:s}".format(a, param_name));

		if ("short" in arg):
			usage_info.append("  {0:s}".format(", ".join([ "-{0:s}{1:s}".format(a, param_name) for a in arg["short"] ])));

		if ("description" in arg):
			usage_info.append("    {0:s}".format(arg["description"]));

	# Output
	stream.write("{0:s}\n".format("\n".join(usage_info)));



# Main
def main():
	# Command line argument settings
	arguments_descriptor = {
		"input": {
			"short": [ "i" ],
			"long": [ "input" ],
			"argument": "path",
			"description": "The input userscript",
		},
		"output": {
			"short": [ "o" ],
			"long": [ "output" ],
			"argument": "path",
			"description": "The output meta header filename",
		},
	};
	arguments, errors = js2crx.arguments_parse(sys.argv, 1, arguments_descriptor, flagless_argument_order=[ "input" , "output" ], return_level=1);



	# Command line parsing errors?
	if (len(errors) > 0):
		for e in errors:
			sys.stderr.write("{0:s}\n".format(e));
		sys.exit(-1);



	# Check for necessary values
	if (
		arguments["input"] is None or
		arguments["output"] is None
	):
		# Usage info
		usage(arguments_descriptor, sys.stderr);
		return -2;



	# Input
	input = os.path.abspath(arguments["input"]);
	output = os.path.abspath(arguments["output"]);


	# Metadata
	f = open(input, "rb");
	source = f.read().decode("utf-8");
	f.close();

	metadata = js2crx.CRXBuilder.get_userscript_metadata(source);
	value_list = metadata["map"]["UserScript"][0]["value_list"];


	# Output
	f = open(output, "wb");

	max_value_length = 0;
	for value in value_list:
		max_value_length = max(max_value_length, len(value[0]));

	f.write("// ==UserScript==\n");

	for value in value_list:
		f.write("// @{{0: <{0:d}s}} {{1:s}}\n".format(max_value_length).format(value[0], value[1]));

	f.write("// ==/UserScript==\n");

	f.close();



	# Done
	return 0;



# Execute
if (__name__ == "__main__"): sys.exit(main());
