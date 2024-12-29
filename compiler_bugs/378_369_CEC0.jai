ivec2 :: struct {x, y : int;}

A :: ivec2.{1, 2};
B :: ivec2.{A.x, 1};
// "All values provided in a non-imperative struct literal must be constant, but argument 1 is not."
// "This struct literal is in a non-imperative scope, so it cannot contain elements that require runtime code."

main :: () {
	C :: ivec2.{A.x, 1};
	// "Declaration claims to be constant, but uses an expression that is not constant."
}
