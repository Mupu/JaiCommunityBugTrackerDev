#import "Basic";

check :: (o1 : $T1, o2 : $T2) { #assert(T1 == T2); }
main :: () {
	check((cast(*void)0).*, #run (cast(*void)0).*); // OK
	check((struct{x:void;}).{}.x, #run (struct{x:void;}).{}.x); // fails
	check(ifx 1{{}}, #run ifx 1{{}}); // fails
}
