#import "Basic";
 
main :: () {
    { // fine
        A :: struct {y := 10;}
        B :: struct{a : A;}
 
        for_expansion :: (b : B, body : Code, $flags : For_Flags) #expand {
            `it, `it_index := 0;
        }
 
        for (B.{.{}}) {}
    }
 
    { // fine
        A :: struct{}
        B :: struct{a : A;}
 
        for_expansion :: (b : B, body : Code, $flags : For_Flags) #expand {
            `it, `it_index := 0;
        }
 
        for (B.{a = .{}}) {}
    }
    { // compiler error
        A :: struct{}
        B :: struct{a : A;}
 
        for_expansion :: (b : B, body : Code, $flags : For_Flags) #expand {
            `it, `it_index := 0;
        }
 
        for (B.{.{}}) {}
    }
}
