#import "Basic";

#import "Compiler";

#run {
    set_build_options_dc(.{do_output = false});
    // When #as is used on a field with basic type, implicit casting occurs only when calling functions, but not when using operators:
    {
        A :: struct {
            #as x : int;
        }
        a := A.{10};
        max(1, a); // ok
        1 + a; // error        
    }
    // However, if the operator is overloaded, the cast succeeds:
    {
        A :: struct {
            x : int;
        }
        operator+ :: (a1 : A, a2 : A) {
        }
         
        B :: struct {
            #as a : A;
        }

        b := B.{.{10}};
        b + b; // ok
    } 
}
 
 
// I understand that this is because the operators for primitives are not actual functions, but i think it's worth reporting.
