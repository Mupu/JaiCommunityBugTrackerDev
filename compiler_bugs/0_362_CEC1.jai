#import "Basic";
#import "Compiler";

#run {
	set_build_options_dc(.{do_output = false});
	for #v2 < -15..-1 {
		alloc(it);
		print("%\n", it);
	}
}
