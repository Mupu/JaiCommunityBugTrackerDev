#import "Basic";
#import "String";

main :: () {
	src := "1230";
	val, ok := parse_int(*src, u8);

	print("% / %\n", val, ok);
}
