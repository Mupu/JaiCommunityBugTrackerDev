#import "Basic";
#import "Compiler";

#run {
    set_build_options_dc(.{do_output = false});
    foo :: (y : int) #expand {
        print("%\n", y);
        y = 10;
        print("%\n", y);
    }
    x := 15;
    foo(x);
    print("%\n", x);        
    // prints 15, 10, 15, so i can assume that x and y are different variables
     
     
    foo :: (y : int) #expand {
        print("%\n", y);
        y = 10; // Error: Attempt to assign to a constant.
        print("%\n", y);
    }
    foo(15);
}
