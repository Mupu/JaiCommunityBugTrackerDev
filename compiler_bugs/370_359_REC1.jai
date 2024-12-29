// I ran into a similar problem in "real code", and for a while I couldn't
// figure out why the program wasn't producing the right result. If the compiler
// had given an error message at compile time, there would have been no problem.

#import "Basic";

main :: () {
	foo :: () -> string #expand {
		// no return
	}

	x := foo();
	print("%\n", x); // causes crash
}
