fn main() {
    println!("cargo:rustc-link-arg=--export=__getrandom_custom");
}