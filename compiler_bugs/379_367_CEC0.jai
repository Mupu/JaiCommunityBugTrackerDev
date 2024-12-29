#import "Basic";

foo :: ($T : Type, proc : (*T)->()) {
	x : T;
	proc(*x);
}

bar :: (x : *string) {
	print("string\n");
}
bar :: (x : *int) {
	print("int\n");
}

Foo :: struct(T : Type, proc : (*T)->()) { }

main :: () {
	foo1 :: #bake_arguments foo(T = int);
	// can decide which "bar" was meant
	foo1(bar);

	// can decide
	Foo1 :: #bake_arguments Foo(T = int);
	Foo1(bar).proc(null);

	// can't
	foo2 :: #bake_arguments foo1(proc = bar);
	foo2();

	// can't
	Foo2 :: #bake_arguments Foo1(proc = bar);
	Foo2.proc(null);

	// can't
	Foo3 :: Foo(int, bar);
	Foo3.proc(null);
}
