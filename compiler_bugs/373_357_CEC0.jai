Wrapper :: struct(T : Type) { #as _ : T; }
 
// works fine
// A :: int;
// A :: float32;
// A :: float64;
// A :: struct{};
// A :: enum u64{};
// A :: string;
// A :: [..]u8;
// A :: []u8;
// A :: [1]u8;
// A :: void;
// A :: Any;
// A :: Type;

// can cast on version 0.2.002 
// A :: u32;
// A :: u16;
// A :: u8;
// A :: enum u32 {};
// A :: enum u16 {};
// A :: enum u8 {};

// can't cast
A :: *B; B :: struct{};
// A :: *int;
// A :: *u8;
 
foo :: (a : A) { }
#import "Compiler";

#run {
    set_build_options_dc(.{do_output = false});
    foo(Wrapper(A).{});
}
