Test :: struct {
  a: int;
}

#add_context test: Test;

main :: () {
   using context;
   test = .{};
}
