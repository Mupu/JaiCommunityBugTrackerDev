#import "Basic";
main :: () {
    a := ifx 1 == { case 1; 42; }
    print("% %\n", a, type_of(a));
    assert(type_of(a) == int);
    assert(a == 42);
}
